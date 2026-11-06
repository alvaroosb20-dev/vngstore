import { LegalPage, V, owner } from "@/components/legal/Legal";
import { site } from "@/lib/config";

export const metadata = { title: "Devoluciones y reembolsos" };

export default function Devoluciones() {
  return (
    <LegalPage title="Devoluciones y reembolsos">
      <h2>Plazo</h2>
      <p>Tienes {site.returnDays} días naturales desde que recibes el pedido para devolverlo, sin necesidad de indicar el motivo.</p>

      <h2>Cómo solicitar una devolución</h2>
      <ul>
        <li>Escríbenos a <V v={owner.email} /> indicando tu número de pedido y los artículos que quieres devolver.</li>
        <li>Te responderemos con la dirección a la que enviar el paquete.</li>
        <li>Envía los productos en su estado original, sin usar y con sus etiquetas.</li>
      </ul>
      <p>También puedes usar el modelo de formulario de desistimiento del Anexo B del Real Decreto Legislativo 1/2007, aunque no es obligatorio.</p>

      <h2>Costes</h2>
      <p>Los gastos de envío de la devolución corren a cargo del cliente, salvo que el producto sea defectuoso o no corresponda con lo pedido.</p>

      <h2>Reembolso</h2>
      <p>
        Reembolsaremos el importe de los productos devueltos, incluidos los gastos de envío iniciales (en la modalidad estándar), en un plazo máximo de 14 días desde que nos comuniques el desistimiento. Podremos retener el reembolso hasta recibir los productos o hasta que acredites su envío. El reembolso se realiza por el mismo medio de pago utilizado en la compra.
      </p>

      <h2>Excepciones</h2>
      <p>Por motivos de higiene, no se admite la devolución de joyería (colgantes, pendientes y similares) que haya sido desprecintada tras la entrega, conforme al art. 103.e) de la Ley General para la Defensa de los Consumidores y Usuarios.</p>

      <h2>Productos defectuosos</h2>
      <p>Si tu producto llega dañado o defectuoso, contacta con nosotros lo antes posible con fotos del producto y te ofreceremos reparación, sustitución o reembolso según la garantía legal.</p>
    </LegalPage>
  );
}
