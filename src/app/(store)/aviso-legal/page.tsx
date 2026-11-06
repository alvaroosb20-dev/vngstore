import { LegalPage, V, owner } from "@/components/legal/Legal";
import { site } from "@/lib/config";

export const metadata = { title: "Aviso legal" };

export default function AvisoLegal() {
  return (
    <LegalPage title="Aviso legal">
      <h2>1. Datos identificativos</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de que el
        sitio web {site.url.replace(/^https?:\/\//, "")} (en adelante, «{site.name}») es titularidad de:
      </p>
      <ul>
        <li>Titular: <V v={owner.legalName} /></li>
        <li>NIF/CIF: <V v={owner.taxId} /></li>
        <li>Domicilio: <V v={owner.address} /></li>
        <li>Email: <V v={owner.email} /></li>
        {owner.phone && <li>Teléfono: {owner.phone}</li>}
        {owner.registry && <li>Datos registrales: {owner.registry}</li>}
      </ul>

      <h2>2. Objeto</h2>
      <p>Este sitio web tiene por objeto la venta online de productos de la marca VNG a consumidores. El acceso y uso del sitio atribuye la condición de usuario e implica la aceptación de este aviso legal.</p>

      <h2>3. Uso del sitio web</h2>
      <p>El usuario se compromete a hacer un uso adecuado de los contenidos y servicios y a no emplearlos para actividades ilícitas, contrarias a la buena fe o al orden público, ni para dañar los sistemas del titular o de terceros.</p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>Todos los contenidos del sitio (diseños, ilustraciones, logotipos, textos, fotografías y código) son titularidad de {site.name} o de terceros que han autorizado su uso. Queda prohibida su reproducción, distribución o transformación sin autorización expresa.</p>

      <h2>5. Responsabilidad</h2>
      <p>El titular no se hace responsable de los daños derivados de interrupciones del servicio, fallos técnicos o del uso indebido del sitio por parte de los usuarios. Los enlaces a sitios de terceros se ofrecen a título informativo.</p>

      <h2>6. Legislación aplicable</h2>
      <p>Este aviso legal se rige por la legislación española. Para cualquier controversia, si el usuario es consumidor, serán competentes los juzgados y tribunales de su domicilio.</p>
    </LegalPage>
  );
}
