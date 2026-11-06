"use client";

import { useActionState } from "react";
import { updateOrder, type ActionState } from "../../actions";
import { FormMessage, SubmitButton } from "@/components/forms";
import { ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";

export function OrderUpdateForm({ order }: { order: Order }) {
  const [state, action] = useActionState<ActionState, FormData>(updateOrder, null);
  return (
    <form action={action} className="card space-y-4 p-6">
      <p className="font-medium text-espresso">Gestionar pedido</p>
      <input type="hidden" name="id" value={order.id} />
      <div>
        <label className="label" htmlFor="status">Estado</label>
        <select id="status" name="status" defaultValue={order.status} className="input">
          {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="carrier">Transportista</label>
          <input id="carrier" name="carrier" defaultValue={order.carrier ?? ""} className="input" placeholder="Correos, SEUR…" />
        </div>
        <div>
          <label className="label" htmlFor="tracking_number">Nº de seguimiento</label>
          <input id="tracking_number" name="tracking_number" defaultValue={order.tracking_number ?? ""} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="tracking_url">Enlace de seguimiento</label>
        <input id="tracking_url" name="tracking_url" type="url" defaultValue={order.tracking_url ?? ""} className="input" placeholder="https://…" />
      </div>
      <div>
        <label className="label" htmlFor="note">Nota para el historial (visible para el cliente)</label>
        <input id="note" name="note" className="input" maxLength={500} />
      </div>
      <FormMessage state={state} />
      <SubmitButton>Guardar</SubmitButton>
      <p className="text-xs text-espresso-500">Para reembolsar, hazlo desde Stripe: el pedido pasará a «Reembolsado» automáticamente.</p>
    </form>
  );
}
