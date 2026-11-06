import { LegalPage, V } from "@/components/legal/Legal";
import { getSettings } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/config";

export const metadata = { title: "Información de envíos" };
export const revalidate = 300;

export default async function Envios() {
  const settings = await getSettings();
  return (
    <LegalPage title="Información de envíos">
      <h2>Zonas de envío</h2>
      <p>Enviamos a todo el territorio español: Península, Baleares, Canarias, Ceuta y Melilla.</p>

      <h2>Costes</h2>
      <ul>
        <li>Envío estándar: {settings.shipping_cents > 0 ? formatPrice(settings.shipping_cents) : "gratuito"}.</li>
        {settings.free_shipping_threshold_cents != null && <li>Envío gratuito en pedidos a partir de {formatPrice(settings.free_shipping_threshold_cents)}.</li>}
      </ul>
      <p>El coste exacto se muestra siempre en la cesta antes de pagar.</p>

      <h2>Plazos</h2>
      <ul>
        <li>Preparación del pedido: <V v={site.shipping.preparationDays} /></li>
        <li>Península y Baleares: <V v={site.shipping.peninsulaDays} /></li>
        <li>Canarias, Ceuta y Melilla: <V v={site.shipping.canariasDays} /></li>
        <li>Transportista: <V v={site.shipping.carrier} /></li>
      </ul>

      <h2>Canarias, Ceuta y Melilla</h2>
      <p>Estos territorios están fuera del ámbito del IVA de la Unión Europea. Los envíos pueden requerir trámites aduaneros y estar sujetos a impuestos locales (IGIC o IPSI), que se te informarán si corresponde.</p>

      <h2>Seguimiento</h2>
      <p>Cuando enviemos tu pedido verás el número de seguimiento en tu cuenta, en «Pedidos».</p>
    </LegalPage>
  );
}
