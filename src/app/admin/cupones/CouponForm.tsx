"use client";

import { useActionState, useRef, useEffect } from "react";
import { createCoupon, type ActionState } from "../actions";
import { FormMessage, SubmitButton } from "@/components/forms";

export function CouponForm() {
  const [state, action] = useActionState<ActionState, FormData>(createCoupon, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="card grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-4"><p className="font-medium text-espresso">Nuevo cupón</p></div>
      <div><label className="label" htmlFor="code">Código</label><input id="code" name="code" required className="input uppercase" placeholder="BIENVENIDA10" maxLength={30} /></div>
      <div>
        <label className="label" htmlFor="type">Tipo</label>
        <select id="type" name="type" className="input"><option value="percent">Porcentaje (%)</option><option value="fixed">Importe fijo (€)</option></select>
      </div>
      <div><label className="label" htmlFor="value">Valor</label><input id="value" name="value" required inputMode="decimal" className="input" placeholder="10" /></div>
      <div><label className="label" htmlFor="min_order">Pedido mínimo (€)</label><input id="min_order" name="min_order" inputMode="decimal" className="input" placeholder="Opcional" /></div>
      <div><label className="label" htmlFor="max_uses">Usos máximos</label><input id="max_uses" name="max_uses" inputMode="numeric" className="input" placeholder="Ilimitado" /></div>
      <div><label className="label" htmlFor="starts_at">Válido desde</label><input id="starts_at" name="starts_at" type="date" className="input" /></div>
      <div><label className="label" htmlFor="expires_at">Caduca el</label><input id="expires_at" name="expires_at" type="date" className="input" /></div>
      <div className="flex items-end"><SubmitButton className="btn-primary w-full">Crear cupón</SubmitButton></div>
      <div className="sm:col-span-2 lg:col-span-4"><FormMessage state={state} /></div>
    </form>
  );
}
