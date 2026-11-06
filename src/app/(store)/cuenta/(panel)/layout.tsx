import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";

const links = [
  { href: "/cuenta", label: "Mis datos" },
  { href: "/cuenta/pedidos", label: "Pedidos" },
  { href: "/cuenta/direcciones", label: "Direcciones" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="container-x pt-10 md:pt-14">
      <p className="eyebrow">Mi cuenta</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Hola{user.user_metadata?.full_name ? `, ${String(user.user_metadata.full_name).split(" ")[0]}` : ""}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1" aria-label="Cuenta">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-full px-4 py-2.5 text-sm text-espresso hover:bg-cream-200 lg:rounded-xl">
              {l.label}
            </Link>
          ))}
          <form action={signOut}>
            <button className="whitespace-nowrap rounded-full px-4 py-2.5 text-left text-sm text-espresso-500 hover:bg-cream-200 lg:w-full lg:rounded-xl">Cerrar sesión</button>
          </form>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
