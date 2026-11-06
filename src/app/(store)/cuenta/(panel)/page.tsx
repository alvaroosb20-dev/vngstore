import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const sp = await searchParams;
  const profile = await getProfile();
  if (!profile) return null;
  return (
    <div className="space-y-6">
      {sp.password === "1" && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Contraseña actualizada correctamente.</p>}
      <h2 className="font-serif text-2xl text-espresso">Mis datos</h2>
      <ProfileForm fullName={profile.full_name ?? ""} phone={profile.phone ?? ""} email={profile.email ?? ""} />
      <p className="text-sm text-espresso-500">
        ¿Quieres cambiar tu contraseña? <Link href="/cuenta/recuperar" className="underline">Te enviamos un enlace</Link>.
      </p>
    </div>
  );
}
