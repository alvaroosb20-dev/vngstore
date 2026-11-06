import Link from "next/link";
import { LegalPage, V, owner } from "@/components/legal/Legal";
import { isPending, site } from "@/lib/config";

export const metadata = { title: "Contacto" };

export default function Contacto() {
  return (
    <LegalPage title="Contacto">
      <p>¿Tienes dudas sobre un producto o un pedido? Escríbenos y te responderemos lo antes posible.</p>
      <ul>
        <li>
          Email:{" "}
          {isPending(owner.email) ? <V v={owner.email} /> : <a href={`mailto:${owner.email}`}>{owner.email}</a>}
        </li>
        {owner.phone && <li>Teléfono: {owner.phone}</li>}
        {site.social.instagram && <li>Instagram: <a href={site.social.instagram} target="_blank" rel="noopener noreferrer">{site.social.instagram.replace(/^https?:\/\/(www\.)?/, "")}</a></li>}
      </ul>
      <p>Si tu consulta es sobre un pedido, indica el número de pedido. Puedes consultar su estado en <Link href="/cuenta/pedidos">tu cuenta</Link>.</p>
    </LegalPage>
  );
}
