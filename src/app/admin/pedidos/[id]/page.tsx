import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderItems, ShippingInfo, StatusHistory } from "@/components/OrderDetail";
import type { Order } from "@/lib/types";
import { OrderUpdateForm } from "./OrderUpdateForm";

export const metadata = { title: "Pedido" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await createAdminClient().from("orders").select("*, order_items(*), order_status_history(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as Order;
  const live = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live");
  const stripeUrl = order.stripe_payment_intent ? `https://dashboard.stripe.com/${live ? "" : "test/"}payments/${order.stripe_payment_intent}` : null;

  return (
    <>
      <Link href="/admin/pedidos" className="text-sm text-espresso-500">← Pedidos</Link>
      <div className="mb-8 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-espresso">Pedido #{order.order_number}</h1>
          <p className="mt-1 text-sm text-espresso-500">
            {formatDate(order.created_at, true)}
            {order.paid_at && ` · Pagado ${formatDate(order.paid_at, true)}`}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <OrderItems order={order} />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card space-y-1 p-6 text-sm">
              <p className="label">Cliente</p>
              <p className="text-espresso">{order.shipping_name ?? "—"}</p>
              <a href={`mailto:${order.email}`} className="text-copper-600 underline">{order.email}</a>
              {order.phone && <p>{order.phone}</p>}
              <p className="pt-2 text-xs text-espresso-500">{order.user_id ? "Cliente registrado" : "Compra como invitado"}</p>
              {stripeUrl && <a href={stripeUrl} target="_blank" rel="noopener noreferrer" className="inline-block pt-3 text-xs underline">Ver pago en Stripe ↗</a>}
            </div>
            <ShippingInfo order={order} />
          </div>
          <div className="card p-6">
            <p className="label mb-3">Historial</p>
            <StatusHistory order={order} />
          </div>
        </div>
        <OrderUpdateForm order={order} />
      </div>
    </>
  );
}
