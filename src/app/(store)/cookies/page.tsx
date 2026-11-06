import { LegalPage } from "@/components/legal/Legal";
import { site } from "@/lib/config";

export const metadata = { title: "Política de cookies" };

export default function Cookies() {
  return (
    <LegalPage title="Política de cookies">
      <p>
        {site.name} utiliza únicamente cookies y almacenamiento local de carácter técnico, necesarios para que la tienda funcione. Según el artículo 22.2 de la LSSI-CE, estas cookies están exentas de consentimiento, aunque te informamos de ellas.
      </p>

      <h2>Cookies y almacenamiento que usamos</h2>
      <div className="overflow-x-auto">
        <table className="mb-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-espresso/15">
              <th className="py-2 pr-4">Nombre</th>
              <th className="py-2 pr-4">Titular</th>
              <th className="py-2 pr-4">Finalidad</th>
              <th className="py-2">Duración</th>
            </tr>
          </thead>
          <tbody className="text-espresso-700">
            <tr className="border-b border-espresso/10"><td className="py-2 pr-4">sb-*-auth-token</td><td className="py-2 pr-4">Propia (Supabase)</td><td className="py-2 pr-4">Mantener tu sesión iniciada</td><td className="py-2">Sesión / hasta cerrar sesión</td></tr>
            <tr className="border-b border-espresso/10"><td className="py-2 pr-4">vng-cart-v1 (localStorage)</td><td className="py-2 pr-4">Propia</td><td className="py-2 pr-4">Guardar los productos de tu cesta</td><td className="py-2">Hasta vaciar la cesta</td></tr>
            <tr className="border-b border-espresso/10"><td className="py-2 pr-4">vng-coupon-v1 (localStorage)</td><td className="py-2 pr-4">Propia</td><td className="py-2 pr-4">Recordar el código promocional aplicado</td><td className="py-2">Hasta finalizar la compra</td></tr>
            <tr className="border-b border-espresso/10"><td className="py-2 pr-4">vng-cookie-notice (localStorage)</td><td className="py-2 pr-4">Propia</td><td className="py-2 pr-4">Recordar que has visto el aviso de cookies</td><td className="py-2">Persistente</td></tr>
          </tbody>
        </table>
      </div>
      <p>Durante el pago, Stripe (checkout.stripe.com) puede instalar sus propias cookies necesarias para procesar el pago y prevenir el fraude. Consulta su política en stripe.com/es/cookie-settings.</p>

      <h2>Cookies de terceros, analítica o publicidad</h2>
      <p>No utilizamos cookies de análisis, publicidad ni redes sociales.</p>

      <h2>Cómo eliminarlas</h2>
      <p>Puedes borrar las cookies y el almacenamiento local desde la configuración de tu navegador. Si lo haces, se cerrará tu sesión y se vaciará tu cesta.</p>
    </LegalPage>
  );
}
