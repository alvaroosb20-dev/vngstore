# VNG Store

Tienda online de VNG Store: Next.js 15 + TypeScript + Tailwind CSS + Supabase (base de datos, login y fotos) + Stripe (pagos) + Vercel (hosting).

## Qué incluye

**Tienda**
- Portada: banner, categorías, destacados, novedades, ofertas, opiniones reales y newsletter.
- Catálogo con buscador y filtros (categoría, precio, disponibilidad, ofertas) y orden (más vendidos, novedades, precio, valoración).
- Ficha de producto: galería, tallas/colores con stock por variante, precio rebajado, valoraciones de compradores verificados, datos estructurados para Google.
- Cesta con cantidades, cupones, envío gratis desde un importe y total recalculado **siempre en el servidor** con precios y stock reales.
- Pago con Stripe Checkout (tarjeta, Apple Pay y Google Pay), página de pedido completado y webhook que confirma el pago, descuenta stock y suma el uso del cupón.

**Clientes**
- Registro, login, recuperación de contraseña, perfil, direcciones (la principal se precarga en el pago), historial y seguimiento de pedidos.
- Los pedidos hechos como invitado se asocian a la cuenta al registrarse con el mismo email verificado.

**Panel `/admin`**
- Resumen: ingresos (30 días y total), ticket medio, gráfico diario, pedidos pendientes de enviar, stock bajo y más vendidos.
- Productos: crear/editar/borrar, subir fotos desde el móvil (se comprimen antes de subir), precios, ofertas, variantes e inventario.
- Pedidos: filtros, detalle, cambio de estado, transportista y nº de seguimiento (el cliente lo ve en su cuenta).
- Clientes, cupones, moderación de valoraciones, newsletter (exportar CSV), envíos y categorías.

**Legal**: aviso legal, privacidad, cookies, condiciones de compra, devoluciones y envíos.

---

## Puesta en marcha (todo desde el navegador del iPhone)

### 1. Supabase
1. Crea un proyecto nuevo en [supabase.com](https://supabase.com) (región Europa).
2. **SQL Editor** → pega y ejecuta `supabase/migrations/0001_schema.sql`.
3. Después pega y ejecuta `supabase/seed.sql` (crea categorías y los 3 productos en **borrador**).
4. **Authentication → URL Configuration**:
   - Site URL: `https://TU-DOMINIO`
   - Redirect URLs: `https://TU-DOMINIO/auth/callback`
5. **Project Settings → API**: copia `Project URL`, `anon public` y `service_role`.

### 2. Stripe
1. **Developers → API keys**: copia la clave secreta (`sk_test_…` para probar, `sk_live_…` para vender).
2. **Developers → Webhooks → Add endpoint**:
   - URL: `https://TU-DOMINIO/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`
   - Copia el **Signing secret** (`whsec_…`).
3. **Settings → Payment methods**: activa Tarjetas, Apple Pay y Google Pay.
4. (Recomendado) **Settings → Customer emails**: activa los recibos de pago para que el cliente reciba el justificante.

### 3. Vercel
1. **Add New → Project** → importa el repo `vngstore`.
2. En **Environment Variables** añade las de `.env.example`:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://TU-DOMINIO` |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (secreta) |
| `STRIPE_SECRET_KEY` | `sk_test_…` / `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` |

3. **Deploy**.

### 4. Hazte administrador
Regístrate en la tienda (`/cuenta/registro`), confirma el email y ejecuta en el SQL Editor de Supabase:

```sql
update public.profiles set role = 'admin' where email = 'TU-EMAIL';
```

Entra en `/admin`.

### 5. Antes de vender
- En `/admin/productos` pon **precio y stock** a cada producto y cambia el estado a **Publicado**.
- En `/admin/ajustes` configura el **coste de envío** y el importe para envío gratis.
- Rellena en `src/lib/config.ts` los datos marcados como `PENDIENTE` (titular, NIF, domicilio, email, plazos y transportista). Mientras falten, aparecen resaltados en las páginas legales.
- Haz una compra de prueba con `sk_test_` y la tarjeta `4242 4242 4242 4242`, comprueba que el pedido aparece como «Pagado» en `/admin/pedidos` y que el stock baja. Luego cambia a las claves `live` (y crea el webhook también en modo live).

---

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # rellena las variables
npm run dev
```

Para probar el webhook en local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Estructura

```
src/
  app/
    (store)/        tienda pública, cuenta de cliente y páginas legales
    admin/          panel de administración (protegido por rol)
    api/            cesta, checkout y webhook de Stripe
    actions/        server actions de clientes (auth, cuenta, reseñas, newsletter)
    auth/callback   enlaces de email de Supabase
  components/       UI reutilizable
  lib/              Supabase, Stripe, precios, catálogo, configuración
supabase/
  migrations/       esquema, RLS y storage
  seed.sql          categorías y productos iniciales (en borrador)
```

## Seguridad
- Row Level Security en todas las tablas: cada cliente solo ve sus pedidos y direcciones; los cupones y la newsletter solo son accesibles desde el servidor.
- Precios, stock, descuentos y envío se recalculan en el servidor; el navegador nunca fija el importe.
- El pago solo se marca como completado con el webhook firmado por Stripe (función SQL atómica e idempotente).
- `/admin` protegido en middleware, en el layout y en cada server action.
- Contraseñas gestionadas por Supabase Auth; los datos de tarjeta nunca pasan por la tienda.

## Limitaciones conocidas
- No hay emails propios de confirmación de pedido ni de envío: el justificante lo envía Stripe (actívalo en Stripe) y el seguimiento se ve en la cuenta del cliente.
- El stock se descuenta al confirmarse el pago. Si dos clientes pagan a la vez la última unidad, puede venderse una de más (se avisaría en el panel con stock 0).
- Las facturas no se generan automáticamente.
