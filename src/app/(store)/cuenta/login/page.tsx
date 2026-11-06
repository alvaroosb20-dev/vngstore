import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthCard, LoginForm } from "../AuthForms";

export const metadata: Metadata = { title: "Iniciar sesión", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/cuenta";
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthCard title="Bienvenido" subtitle="Accede a tus pedidos, direcciones y datos.">
      <LoginForm next={next} linkError={sp.error === "enlace"} />
    </AuthCard>
  );
}
