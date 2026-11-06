import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderItems, OrderTimeline, ShippingInfo, StatusHistory } from "@/components/OrderDetail";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Detalle del pedido", robots: { index: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*)")
    .eq("id", id)
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  if (!data) notFound();
  const order = data as Order;

  return (
    <div className="space-y-6">
      <Link href="/cuenta/pedidos" className="text-sm text-espresso-500 hover:text-espresso">← Mis pedidos</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl text-espresso">Pedido nº {order.order_number}</h2>
          <p className="text-sm text-espresso-500">Realizado el {formatDate(order.created_at, true)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <OrderTimeline order={order} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <OrderItems order={order} />
        <div className="space-y-6">
          <ShippingInfo order={order} />
          <div className="card p-6">
            <p className="label mb-3">Historial</p>
            <StatusHistory order={order} />
          </div>
        </div>
      </div>
      <p className="text-sm text-espresso-500">
        ¿Algún problema con tu pedido? <Link href="/contacto" className="underline">Contáctanos</Link> o consulta la{" "}
        <Link href="/devoluciones" className="underline">política de devoluciones</Link>.
      </p>
    </div>
  );
}
