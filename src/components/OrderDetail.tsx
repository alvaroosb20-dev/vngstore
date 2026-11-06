import Image from "next/image";
import { formatDate, formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const FLOW: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

export function OrderTimeline({ order }: { order: Order }) {
  if (["cancelled", "refunded", "pending"].includes(order.status)) {
    return <p className="rounded-xl bg-cream-100 p-4 text-sm text-espresso-700">Estado: {ORDER_STATUS_LABEL[order.status]}</p>;
  }
  const current = FLOW.indexOf(order.status);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {FLOW.map((s, i) => (
        <li key={s} className="flex flex-col gap-2">
          <span className={`h-1.5 rounded-full ${i <= current ? "bg-espresso" : "bg-espresso/10"}`} />
          <span className={`text-[11px] sm:text-xs ${i <= current ? "text-espresso" : "text-espresso-300"}`}>{ORDER_STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}

export function OrderItems({ order }: { order: Order }) {
  return (
    <div className="card p-6">
      <ul className="divide-y divide-espresso/10">
        {(order.order_items ?? []).map((i) => (
          <li key={i.id} className="flex items-center gap-4 py-4">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-cream-200">
              {i.image_url && <Image src={i.image_url} alt="" fill sizes="56px" className="object-cover" />}
            </div>
            <div className="flex-1 text-sm">
              <p className="text-espresso">{i.product_name}</p>
              <p className="text-espresso-500">{[i.variant_label, `${i.quantity} × ${formatPrice(i.unit_price_cents)}`].filter(Boolean).join(" · ")}</p>
            </div>
            <p className="text-sm">{formatPrice(i.unit_price_cents * i.quantity)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 border-t border-espresso/10 pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-espresso-500">Subtotal</dt><dd>{formatPrice(order.subtotal_cents)}</dd></div>
        {order.discount_cents > 0 && (
          <div className="flex justify-between text-copper-600"><dt>Descuento {order.coupon_code ? `(${order.coupon_code})` : ""}</dt><dd>-{formatPrice(order.discount_cents)}</dd></div>
        )}
        <div className="flex justify-between"><dt className="text-espresso-500">Envío</dt><dd>{order.shipping_cents ? formatPrice(order.shipping_cents) : "Gratis"}</dd></div>
        <div className="flex justify-between text-base font-medium"><dt>Total</dt><dd>{formatPrice(order.total_cents)}</dd></div>
      </dl>
    </div>
  );
}

export function ShippingInfo({ order }: { order: Order }) {
  const a = order.shipping_address;
  return (
    <div className="card space-y-1 p-6 text-sm text-espresso-700">
      <p className="label">Envío a</p>
      {a ? (
        <>
          <p className="text-espresso">{order.shipping_name}</p>
          <p>{a.line1}</p>
          {a.line2 && <p>{a.line2}</p>}
          <p>{[a.postal_code, a.city].filter(Boolean).join(" ")}{a.state ? `, ${a.state}` : ""}</p>
          {order.phone && <p>{order.phone}</p>}
        </>
      ) : (
        <p className="text-espresso-500">Sin dirección registrada</p>
      )}
      {order.tracking_number && (
        <div className="mt-4 border-t border-espresso/10 pt-4">
          <p className="label">Seguimiento</p>
          <p>
            {order.carrier ? `${order.carrier}: ` : ""}
            {order.tracking_url ? (
              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-copper-600 underline">{order.tracking_number}</a>
            ) : (
              order.tracking_number
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export function StatusHistory({ order }: { order: Order }) {
  const h = [...(order.order_status_history ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (!h.length) return null;
  return (
    <ul className="space-y-3 text-sm">
      {h.map((e) => (
        <li key={e.id} className="flex gap-3">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-copper" />
          <div>
            <p className="text-espresso">{ORDER_STATUS_LABEL[e.status as OrderStatus] ?? e.status}{e.note ? ` — ${e.note}` : ""}</p>
            <p className="text-xs text-espresso-300">{formatDate(e.created_at, true)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
