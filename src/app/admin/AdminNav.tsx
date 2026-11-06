"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/cupones", label: "Cupones" },
  { href: "/admin/valoraciones", label: "Valoraciones" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/ajustes", label: "Ajustes" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0" aria-label="Administración">
      {items.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm transition ${active ? "bg-espresso text-cream-50" : "text-espresso hover:bg-cream-200"}`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
