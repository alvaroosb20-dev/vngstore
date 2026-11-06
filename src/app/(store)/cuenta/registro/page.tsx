import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthCard, RegisterForm } from "../AuthForms";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false } };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/cuenta");
  return (
    <AuthCard title="Crear cuenta" subtitle="Sigue tus pedidos y compra más rápido.">
      <RegisterForm />
    </AuthCard>
  );
}
