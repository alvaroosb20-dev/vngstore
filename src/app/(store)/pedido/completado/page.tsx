import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";
import { ClearCart } from "./ClearCart";

export const metadata: Metadata = { title: "Pedido completado", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderCompletePage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  if (!session_id || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(session_id)) redirect("/");

  const session = await stripe()
    .checkout.sessions.retrieve(session_id)
    .catch(() => null);
  if (!session) redirect("/");

  const orderId = session.metadata?.order_id;
  const db = createAdminClient();
  const { data } = orderId ? await db.from("orders").select("*, order_items(*)").eq("id", orderId).single() : { data: null };
  const order = data as Order | null;
  const paid = session.payment_status === "paid";

  return (
    <div className="container-x max-w-3xl pt-14 md:pt-20">
      {paid && <ClearCart />}
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-espresso text-2xl text-cream-50 animate-fade-in">
          {paid ? "✓" : "…"}
        </div>
        <p className="eyebrow">{order ? `Pedido nº ${order.order_number}` : "Pedido"}</p>
        <h1 className="h-display mt-3 text-4xl md:text-5xl">{paid ? "¡Gracias por tu compra!" : "Estamos procesando tu pago"}</h1>
        <p className="mx-auto mt-4 max-w-md text-espresso-500">
          {paid
            ? `Hemos recibido tu pago. Recibirás el justificante en ${session.customer_details?.email ?? "tu email"}.`
            : "Tu pago está pendiente de confirmación. Te avisaremos en cuanto se complete."}
        </p>
      </div>

      {order?.order_items && (
        <div className="card mt-12 p-6">
          <ul className="divide-y divide-espresso/10">
            {order.order_items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                  {i.image_url && <Image src={i.image_url} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="text-espresso">{i.product_name}</p>
                  <p className="text-espresso-500">{[i.variant_label, `x${i.quantity}`].filter(Boolean).join(" · ")}</p>
                </div>
                <p className="text-sm">{formatPrice(i.unit_price_cents * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-espresso/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-espresso-500">Subtotal</dt><dd>{formatPrice(order.subtotal_cents)}</dd></div>
            {order.discount_cents > 0 && <div className="flex justify-between text-copper-600"><dt>Descuento</dt><dd>-{formatPrice(order.discount_cents)}</dd></div>}
            <div className="flex justify-between"><dt className="text-espresso-500">Envío</dt><dd>{order.shipping_cents ? formatPrice(order.shipping_cents) : "Gratis"}</dd></div>
            <div className="flex justify-between font-medium"><dt>Total</dt><dd>{formatPrice(order.total_cents)}</dd></div>
          </dl>
        </div>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {order?.user_id ? (
          <Link href={`/cuenta/pedidos/${order.id}`} className="btn-primary">Seguir mi pedido</Link>
        ) : (
          <Link href="/cuenta/registro" className="btn-primary">Crear cuenta para seguir mis pedidos</Link>
        )}
        <Link href="/tienda" className="btn-outline">Seguir comprando</Link>
      </div>
    </div>
  );
}
