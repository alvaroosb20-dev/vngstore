import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "./AdminNav";
import { missingSupabaseEnv } from "@/lib/config";
import { SetupNotice } from "@/components/SetupNotice";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin VNG" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const missing = missingSupabaseEnv();
  if (missing.length) return <SetupNotice missing={missing} />;
  const profile = await requireAdmin();
  return (
    <div className="min-h-screen bg-cream-100 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-espresso/10 bg-cream-50 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link href="/admin" className="block">
            <span className="font-serif text-2xl font-semibold text-espresso">VNG</span>
            <span className="ml-2 text-[10px] uppercase tracking-widest2 text-copper">Admin</span>
          </Link>
          <Link href="/" className="text-xs text-espresso-500 underline lg:mt-2 lg:inline-block">Ver tienda ↗</Link>
        </div>
        <AdminNav />
        <div className="hidden px-5 py-6 text-xs text-espresso-500 lg:absolute lg:bottom-0 lg:block">
          <p className="truncate">{profile.email}</p>
          <form action={signOut}><button className="mt-2 underline">Cerrar sesión</button></form>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">{children}</div>
    </div>
  );
}
