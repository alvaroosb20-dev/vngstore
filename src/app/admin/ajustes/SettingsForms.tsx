"use client";

import { useActionState } from "react";
import { saveCategory, saveSettings, type ActionState } from "../actions";
import { FormMessage, SubmitButton } from "@/components/forms";
import { centsToInput } from "@/lib/format";
import type { Category, Settings } from "@/lib/types";

export function ShippingForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState<ActionState, FormData>(saveSettings, null);
  return (
    <form action={action} className="card space-y-4 p-6">
      <p className="font-medium text-espresso">Envíos</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="shipping">Coste de envío (€)</label>
          <input id="shipping" name="shipping" inputMode="decimal" defaultValue={centsToInput(settings.shipping_cents)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="free_threshold">Envío gratis desde (€)</label>
          <input id="free_threshold" name="free_threshold" inputMode="decimal" defaultValue={centsToInput(settings.free_shipping_threshold_cents)} className="input" placeholder="Vacío = nunca gratis" />
        </div>
      </div>
      <FormMessage state={state} />
      <SubmitButton>Guardar envíos</SubmitButton>
    </form>
  );
}

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action] = useActionState<ActionState, FormData>(saveCategory, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_90px_auto] sm:items-end">
      {category && <input type="hidden" name="id" value={category.id} />}
      <div><label className="label">Nombre</label><input name="name" defaultValue={category?.name} required className="input py-2.5" /></div>
      <div><label className="label">Descripción</label><input name="description" defaultValue={category?.description ?? ""} className="input py-2.5" /></div>
      <div><label className="label">Orden</label><input name="position" inputMode="numeric" defaultValue={category?.position ?? 0} className="input py-2.5" /></div>
      <SubmitButton className="btn-outline py-2.5">{category ? "Guardar" : "Añadir"}</SubmitButton>
      {state && <div className="sm:col-span-4"><FormMessage state={state} /></div>}
    </form>
  );
}
