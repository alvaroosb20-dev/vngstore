"use client";

import { useActionState } from "react";
import { updateProfile, type FormState } from "@/app/actions/account";
import { Field, FormMessage, SubmitButton } from "@/components/forms";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, null);
  return (
    <form action={action} className="card max-w-xl space-y-5 p-7">
      <Field label="Email" name="email" value={email} disabled readOnly />
      <Field label="Nombre y apellidos" name="full_name" defaultValue={fullName} required autoComplete="name" />
      <Field label="Teléfono" name="phone" defaultValue={phone} type="tel" autoComplete="tel" />
      <FormMessage state={state} />
      <SubmitButton>Guardar cambios</SubmitButton>
    </form>
  );
}
