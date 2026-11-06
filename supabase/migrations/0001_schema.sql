-- =====================================================================
-- VNG Store — esquema de base de datos
-- Ejecutar en Supabase → SQL Editor (una sola vez, en un proyecto nuevo)
-- Todos los importes se guardan en céntimos (integer) para evitar errores de redondeo.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  details text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  price_cents int not null default 0 check (price_cents >= 0),
  compare_at_cents int check (compare_at_cents is null or compare_at_cents >= 0),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  featured boolean not null default false,
  is_new boolean not null default false,
  sales_count int not null default 0,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on public.products(status);
create index products_category_idx on public.products(category_id);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text,
  alt text not null default '',
  position int not null default 0
);
create index product_images_product_idx on public.product_images(product_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text,
  color text,
  sku text unique,
  stock int not null default 0 check (stock >= 0),
  price_cents int check (price_cents is null or price_cents >= 0),
  position int not null default 0
);
create index product_variants_product_idx on public.product_variants(product_id);

-- ---------------------------------------------------------------------
-- Valoraciones (solo compradores verificados, moderadas por el admin)
-- ---------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create or replace function public.refresh_product_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where product_id = pid and approved), 0),
    rating_count = (select count(*) from public.reviews where product_id = pid and approved)
  where p.id = pid;
  return null;
end $$;

create trigger reviews_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- ---------------------------------------------------------------------
-- Direcciones
-- ---------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  province text not null,
  postal_code text not null,
  country text not null default 'ES',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses(user_id);

-- ---------------------------------------------------------------------
-- Cupones
-- ---------------------------------------------------------------------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  type text not null check (type in ('percent','fixed')),
  value int not null check (value > 0),
  min_order_cents int not null default 0,
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (type <> 'percent' or value <= 100)
);

-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity (start with 1001) unique,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  subtotal_cents int not null,
  discount_cents int not null default 0,
  shipping_cents int not null default 0,
  total_cents int not null,
  coupon_code text,
  shipping_name text,
  shipping_address jsonb,
  phone text,
  stripe_session_id text unique,
  stripe_payment_intent text,
  carrier text,
  tracking_number text,
  tracking_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_created_idx on public.orders(created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_label text,
  image_url text,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0)
);
create index order_items_order_idx on public.order_items(order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history(order_id);

-- Marca un pedido como pagado de forma atómica e idempotente:
-- descuenta stock, suma ventas y usos del cupón. Solo lo llama el webhook de Stripe (service_role).
create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_payment_intent text,
  p_shipping_name text,
  p_shipping_address jsonb,
  p_phone text
) returns boolean language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found or o.status <> 'pending' then
    return false;
  end if;

  update public.orders set
    status = 'paid',
    paid_at = now(),
    stripe_payment_intent = p_payment_intent,
    shipping_name = coalesce(p_shipping_name, shipping_name),
    shipping_address = coalesce(p_shipping_address, shipping_address),
    phone = coalesce(p_phone, phone)
  where id = p_order_id;

  update public.product_variants v
     set stock = greatest(v.stock - i.quantity, 0)
    from public.order_items i
   where i.order_id = p_order_id and i.variant_id = v.id;

  update public.products p
     set sales_count = p.sales_count + s.qty
    from (select product_id, sum(quantity)::int qty from public.order_items
           where order_id = p_order_id group by product_id) s
   where s.product_id = p.id;

  if o.coupon_code is not null then
    update public.coupons set used_count = used_count + 1 where code = o.coupon_code;
  end if;

  insert into public.order_status_history (order_id, status, note)
  values (p_order_id, 'paid', 'Pago confirmado por Stripe');
  return true;
end $$;

revoke all on function public.mark_order_paid(uuid, text, text, jsonb, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Newsletter y ajustes
-- ---------------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.settings (
  id int primary key default 1 check (id = 1),
  shipping_cents int not null default 0,
  free_shipping_threshold_cents int,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict do nothing;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.reviews enable row level security;
alter table public.addresses enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.settings enable row level security;

-- Perfiles: cada uno ve y edita el suyo (sin poder cambiar su rol)
create policy "profiles self read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone) on public.profiles to authenticated;

-- Catálogo: lectura pública de lo publicado
create policy "categories public read" on public.categories for select using (true);
create policy "products public read" on public.products for select using (status = 'active' or public.is_admin());
create policy "images public read" on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_id and (p.status = 'active' or public.is_admin()))
);
create policy "variants public read" on public.product_variants for select using (
  exists (select 1 from public.products p where p.id = product_id and (p.status = 'active' or public.is_admin()))
);

-- Valoraciones: públicas si están aprobadas; el autor ve la suya;
-- solo puede valorar quien ha comprado y pagado ese producto.
create policy "reviews read" on public.reviews for select using (approved or user_id = auth.uid() or public.is_admin());
create policy "reviews insert by buyers" on public.reviews for insert with check (
  user_id = auth.uid()
  and approved = false
  and exists (
    select 1 from public.orders o join public.order_items i on i.order_id = o.id
    where o.user_id = auth.uid() and i.product_id = reviews.product_id
      and o.status in ('paid','processing','shipped','delivered')
  )
);

-- Direcciones: solo el propietario
create policy "addresses owner" on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Pedidos: el cliente ve los suyos (se crean solo desde el servidor)
create policy "orders owner read" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "order items owner read" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
create policy "order history owner read" on public.order_status_history for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);

-- Ajustes de envío: lectura pública
create policy "settings public read" on public.settings for select using (true);

-- coupons y newsletter_subscribers no tienen políticas públicas:
-- solo se accede desde el servidor con la service_role key.

-- ---------------------------------------------------------------------
-- Storage: bucket público para fotos de producto
-- (las subidas se hacen desde el servidor tras comprobar que el usuario es admin)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
