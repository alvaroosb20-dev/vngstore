import Link from "next/link";
import { LegalPage, V, owner } from "@/components/legal/Legal";
import { site } from "@/lib/config";

export const metadata = { title: "Condiciones de compra" };

export default function Condiciones() {
  return (
    <LegalPage title="Condiciones generales de compra">
      <h2>1. Vendedor</h2>
      <p>
        Las ventas realizadas en {site.name} las efectúa <V v={owner.legalName} />, con NIF <V v={owner.taxId} /> y domicilio en <V v={owner.address} />. Contacto: <V v={owner.email} />.
      </p>

      <h2>2. Ámbito</h2>
      <p>Estas condiciones regulan la compra de productos a través de este sitio web por parte de consumidores, conforme al Real Decreto Legislativo 1/2007 (Ley General para la Defensa de los Consumidores y Usuarios) y a la LSSI-CE. Al realizar un pedido aceptas estas condiciones.</p>

      <h2>3. Precios</h2>
      <p>Los precios se muestran en euros e incluyen el IVA aplicable. Los gastos de envío se indican en la cesta antes de pagar y se suman al total. El precio aplicable es el vigente en el momento de realizar el pedido.</p>

      <h2>4. Proceso de compra</h2>
      <ul>
        <li>Añade los productos a la cesta y revisa cantidades, descuentos y gastos de envío.</li>
        <li>Pulsa «Pagar de forma segura»: serás redirigido a la pasarela de Stripe, donde indicarás tus datos de envío y de pago.</li>
        <li>Una vez confirmado el pago, recibirás el justificante por email y podrás consultar el pedido en tu cuenta.</li>
      </ul>
      <p>El contrato se entiende perfeccionado con la confirmación del pago. El pedido queda archivado en nuestro sistema y puedes consultarlo en tu cuenta.</p>

      <h2>5. Formas de pago</h2>
      <p>Tarjeta de crédito o débito, Apple Pay y Google Pay, a través de Stripe. El cargo se realiza en el momento de confirmar el pedido.</p>

      <h2>6. Disponibilidad</h2>
      <p>Todos los pedidos están sujetos a disponibilidad. Si tras el pago un producto no estuviera disponible por causas excepcionales, te informaremos y reembolsaremos el importe correspondiente sin demora.</p>

      <h2>7. Envío y entrega</h2>
      <p>Consulta plazos y costes en <Link href="/envios">información de envíos</Link>.</p>

      <h2>8. Derecho de desistimiento</h2>
      <p>
        Dispones de {site.returnDays} días naturales desde la recepción del pedido para desistir de la compra sin necesidad de justificación. Consulta el procedimiento en la{" "}
        <Link href="/devoluciones">política de devoluciones y reembolsos</Link>.
      </p>

      <h2>9. Garantía</h2>
      <p>Los productos cuentan con la garantía legal de conformidad de 3 años desde la entrega prevista en la normativa de consumo. Si recibes un producto defectuoso, contacta con nosotros en <V v={owner.email} />.</p>

      <h2>10. Resolución de litigios</h2>
      <p>Estas condiciones se rigen por la ley española. Si eres consumidor, serán competentes los juzgados de tu domicilio. Puedes acudir también a la Junta Arbitral de Consumo o a otros sistemas de resolución extrajudicial de conflictos.</p>
    </LegalPage>
  );
}
