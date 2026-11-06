import { LegalPage, V, owner } from "@/components/legal/Legal";
import { site } from "@/lib/config";

export const metadata = { title: "Política de privacidad" };

export default function Privacidad() {
  return (
    <LegalPage title="Política de privacidad">
      <p>
        Esta política explica cómo tratamos tus datos personales conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>Responsable: <V v={owner.legalName} /></li>
        <li>NIF/CIF: <V v={owner.taxId} /></li>
        <li>Domicilio: <V v={owner.address} /></li>
        <li>Email de contacto: <V v={owner.email} /></li>
      </ul>

      <h2>2. Qué datos tratamos y para qué</h2>
      <h3>Compras</h3>
      <p>Nombre, email, teléfono, dirección de envío y datos del pedido, para gestionar la compra, el envío, la facturación, las devoluciones y la atención al cliente. Base legal: ejecución del contrato (art. 6.1.b RGPD) y obligaciones legales fiscales (art. 6.1.c).</p>
      <h3>Cuenta de usuario</h3>
      <p>Nombre, email, teléfono y direcciones guardadas, para que puedas consultar tus pedidos y comprar más rápido. Base legal: ejecución del contrato.</p>
      <h3>Valoraciones</h3>
      <p>Tu nombre de pila y el contenido de la valoración, que se publica junto al producto. Base legal: tu consentimiento al enviarla.</p>
      <h3>Newsletter</h3>
      <p>Tu email, para enviarte novedades y ofertas. Base legal: tu consentimiento (art. 6.1.a), que puedes retirar en cualquier momento escribiendo a <V v={owner.email} />.</p>

      <h2>3. Pagos</h2>
      <p>Los pagos se procesan a través de Stripe Payments Europe, Ltd. {site.name} no recibe ni almacena los datos completos de tu tarjeta. Stripe actúa como responsable independiente para la prevención del fraude y el cumplimiento normativo de pagos.</p>

      <h2>4. Destinatarios y encargados del tratamiento</h2>
      <ul>
        <li>Stripe (procesamiento de pagos).</li>
        <li>Supabase (alojamiento de la base de datos y autenticación).</li>
        <li>Vercel (alojamiento del sitio web).</li>
        <li>Empresas de transporte, solo con los datos necesarios para la entrega.</li>
        <li>Administraciones públicas cuando exista obligación legal.</li>
      </ul>
      <p>Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo. En ese caso lo hacen al amparo de decisiones de adecuación o cláusulas contractuales tipo aprobadas por la Comisión Europea.</p>

      <h2>5. Conservación</h2>
      <p>Los datos de compras se conservan durante los plazos legales (en general, 6 años por obligaciones mercantiles y fiscales). Los datos de la cuenta, mientras no solicites su eliminación. Los de la newsletter, hasta que te des de baja.</p>

      <h2>6. Tus derechos</h2>
      <p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <V v={owner.email} />, indicando el derecho que ejerces. Si consideras que no hemos atendido correctamente tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).</p>

      <h2>7. Seguridad</h2>
      <p>Aplicamos medidas técnicas y organizativas adecuadas: conexiones cifradas (HTTPS), control de acceso por usuario y contraseñas cifradas.</p>
    </LegalPage>
  );
}
