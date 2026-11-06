import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Mis pedidos", robots: { index: false } };

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, total_cents, created_at, order_items(quantity)")
    .eq("user_id", user?.id ?? "")
    .neq("status", "pending")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Pick<Order, "id" | "order_number" | "status" | "total_cents" | "created_at" | "order_items">[];

  return (
    <div>
      <h2 className="mb-6 font-serif text-2xl text-espresso">Mis pedidos</h2>
      {orders.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-espresso-500">Aún no has hecho ningún pedido.</p>
          <Link href="/tienda" className="btn-primary mt-5">Ir a la tienda</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/cuenta/pedidos/${o.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-5 transition hover:border-espresso/30">
                <div>
                  <p className="font-medium text-espresso">Pedido nº {o.order_number}</p>
                  <p className="text-sm text-espresso-500">
                    {formatDate(o.created_at)} · {o.order_items?.reduce((s, i) => s + i.quantity, 0)} artículos
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={o.status} />
                  <span className="font-medium">{formatPrice(o.total_cents)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
