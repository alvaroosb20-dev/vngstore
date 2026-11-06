"use client";

import { useActionState, useEffect, useState } from "react";
import { saveAddress, type FormState } from "@/app/actions/account";
import { Field, FormMessage, SubmitButton } from "@/components/forms";
import type { Address } from "@/lib/types";

export function AddressForm({ address, onDone }: { address?: Address; onDone?: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(saveAddress, null);
  useEffect(() => {
    if (state?.ok) onDone?.();
  }, [state, onDone]);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {address && <input type="hidden" name="id" value={address.id} />}
      <div className="sm:col-span-2"><Field label="Destinatario" name="full_name" defaultValue={address?.full_name} required autoComplete="name" /></div>
      <div className="sm:col-span-2"><Field label="Dirección" name="line1" defaultValue={address?.line1} required autoComplete="address-line1" /></div>
      <div className="sm:col-span-2"><Field label="Piso, puerta… (opcional)" name="line2" defaultValue={address?.line2 ?? ""} autoComplete="address-line2" /></div>
      <Field label="Código postal" name="postal_code" defaultValue={address?.postal_code} required inputMode="numeric" maxLength={5} autoComplete="postal-code" />
      <Field label="Localidad" name="city" defaultValue={address?.city} required autoComplete="address-level2" />
      <Field label="Provincia" name="province" defaultValue={address?.province} required autoComplete="address-level1" />
      <Field label="Teléfono" name="phone" defaultValue={address?.phone ?? ""} type="tel" autoComplete="tel" />
      <label className="flex items-center gap-2 text-sm text-espresso-700 sm:col-span-2">
        <input type="checkbox" name="is_default" defaultChecked={address?.is_default} className="accent-espresso" /> Usar como dirección principal
      </label>
      <div className="sm:col-span-2"><FormMessage state={state} /></div>
      <div className="sm:col-span-2"><SubmitButton>Guardar dirección</SubmitButton></div>
    </form>
  );
}

export function NewAddress() {
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} className="btn-outline">+ Añadir dirección</button>;
  return (
    <div className="card p-6">
      <AddressForm onDone={() => setOpen(false)} />
    </div>
  );
}

export function EditAddress({ address }: { address: Address }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen((v) => !v)} className="text-sm text-espresso underline underline-offset-2">{open ? "Cerrar" : "Editar"}</button>
      {open && (
        <div className="mt-4 w-full border-t border-espresso/10 pt-4">
          <AddressForm address={address} onDone={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
