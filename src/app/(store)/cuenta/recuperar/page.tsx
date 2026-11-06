import type { Metadata } from "next";
import { AuthCard, RecoverForm } from "../AuthForms";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false } };

export default function RecoverPage() {
  return (
    <AuthCard title="Recuperar contraseña" subtitle="Te enviaremos un enlace para crear una nueva.">
      <RecoverForm />
    </AuthCard>
  );
}
