import type { Metadata } from "next";
import { AuthCard, NewPasswordForm } from "../AuthForms";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };

export default function NewPasswordPage() {
  return (
    <AuthCard title="Nueva contraseña">
      <NewPasswordForm />
    </AuthCard>
  );
}
