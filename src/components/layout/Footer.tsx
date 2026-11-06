import Link from "next/link";
import { Logo } from "@/components/Logo";
import { site } from "@/lib/config";

const groups = [
  {
    title: "Tienda",
    links: [
      { href: "/tienda", label: "Todos los productos" },
      { href: "/tienda?orden=new", label: "Novedades" },
      { href: "/tienda?ofertas=1", label: "Ofertas" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { href: "/envios", label: "Envíos" },
      { href: "/devoluciones", label: "Devoluciones y reembolsos" },
      { href: "/cuenta/pedidos", label: "Seguimiento de pedidos" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/aviso-legal", label: "Aviso legal" },
      { href: "/privacidad", label: "Política de privacidad" },
      { href: "/cookies", label: "Política de cookies" },
      { href: "/condiciones", label: "Condiciones de compra" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-espresso/10 bg-cream-100">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo size="sm" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-espresso-500">{site.tagline}</p>
          {site.social.instagram && (
            <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="link-underline mt-4 inline-block text-sm text-espresso">
              Instagram
            </a>
          )}
        </div>
        {groups.map((g) => (
          <div key={g.title}>
            <p className="eyebrow mb-4">{g.title}</p>
            <ul className="space-y-2.5">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-underline text-sm text-espresso-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-espresso/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-espresso-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {site.name}. Todos los derechos reservados.</p>
          <p>Pagos seguros con Stripe · Tarjeta, Apple Pay y Google Pay</p>
        </div>
      </div>
    </footer>
  );
}
