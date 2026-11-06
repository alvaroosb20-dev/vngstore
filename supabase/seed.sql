-- =====================================================================
-- VNG Store — datos iniciales
-- Crea las categorías y los 3 productos de la colección en estado BORRADOR,
-- con precio 0 y stock 0. No se venden hasta que en /admin les pongas
-- precio y stock reales y los marques como "Publicado".
-- Ejecutar DESPUÉS de 0001_schema.sql.
-- =====================================================================

insert into public.categories (slug, name, description, position) values
  ('camisetas', 'Camisetas', 'Algodón y trazo fino.', 1),
  ('bolsos', 'Bolsos', 'Tote bags para el día a día.', 2),
  ('joyeria', 'Joyería', 'Piezas delicadas para llevar siempre.', 3)
on conflict (slug) do nothing;

with p as (
  insert into public.products (slug, name, description, details, category_id, price_cents, status, featured, is_new)
  values (
    'camiseta-angel',
    'Camiseta Ángel',
    'Camiseta color crudo con la ilustración del ángel en un solo trazo. Logotipo VNG bordado en la manga.',
    'Ilustración frontal a una línea · Etiqueta VNG Store en el cuello · Logotipo VNG en la manga',
    (select id from public.categories where slug = 'camisetas'),
    0, 'draft', true, true
  ) returning id
)
insert into public.product_images (product_id, url, alt, position)
select id, '/products/camiseta-angel-frontal.jpg', 'Camiseta Ángel VNG, vista frontal', 0 from p
union all
select id, '/products/camiseta-angel-doblada.jpg', 'Camiseta Ángel VNG doblada, detalle de manga', 1 from p;

insert into public.product_variants (product_id, size, color, sku, stock, position)
select p.id, s.size, 'Crudo', 'VNG-CAM-ANG-' || s.size, 0, s.pos
from public.products p
cross join (values ('XS',0),('S',1),('M',2),('L',3),('XL',4)) as s(size, pos)
where p.slug = 'camiseta-angel';

with p as (
  insert into public.products (slug, name, description, details, category_id, price_cents, status, featured, is_new)
  values (
    'tote-angel',
    'Tote Bag Ángel',
    'Bolsa de lona color natural con la ilustración del ángel en un solo trazo.',
    'Asas largas para llevar al hombro · Ilustración a una línea',
    (select id from public.categories where slug = 'bolsos'),
    0, 'draft', true, true
  ) returning id
)
insert into public.product_images (product_id, url, alt, position)
select id, '/products/tote-angel.jpg', 'Tote bag Ángel VNG', 0 from p;

insert into public.product_variants (product_id, size, color, sku, stock, position)
select id, 'Única', 'Natural', 'VNG-TOTE-ANG', 0, 0 from public.products where slug = 'tote-angel';

with p as (
  insert into public.products (slug, name, description, details, category_id, price_cents, status, featured, is_new)
  values (
    'colgante-trebol',
    'Colgante Trébol',
    'Colgante en forma de trébol de cuatro hojas con corazones calados y circonita brillante engastada en el centro. Incluye plaquita grabada VNG.',
    'Altura del colgante: 2,0 cm · Plaquita VNG: 5 × 8 mm · Circonita engastada',
    (select id from public.categories where slug = 'joyeria'),
    0, 'draft', true, true
  ) returning id
)
insert into public.product_images (product_id, url, alt, position)
select id, '/products/colgante-trebol.jpg', 'Colgante Trébol VNG con circonita', 0 from p;

insert into public.product_variants (product_id, size, color, sku, stock, position)
select id, 'Única', 'Plateado', 'VNG-COL-TREBOL', 0, 0 from public.products where slug = 'colgante-trebol';
