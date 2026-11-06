import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook no configurado" }, { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, secret);
  } catch (e) {
    console.error("Firma de webhook no válida", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Firma no válida" }, { status: 400 });
  }

  const db = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") break; // pagos asíncronos: esperamos a async_payment_succeeded
        const orderId = session.metadata?.order_id;
        if (!orderId) break;

        // Según la versión de API del endpoint, Stripe envía la dirección en un campo u otro
        const loose = session as unknown as {
          collected_information?: { shipping_details?: { name?: string; address?: Stripe.Address } | null } | null;
          shipping_details?: { name?: string; address?: Stripe.Address } | null;
        };
        const shipping = loose.collected_information?.shipping_details ?? loose.shipping_details ?? null;
        const email = session.customer_details?.email ?? null;
        if (email) await db.from("orders").update({ email }).eq("id", orderId);

        const { error } = await db.rpc("mark_order_paid", {
          p_order_id: orderId,
          p_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
          p_shipping_name: shipping?.name ?? session.customer_details?.name ?? null,
          p_shipping_address: shipping?.address ?? session.customer_details?.address ?? null,
          p_phone: session.customer_details?.phone ?? null,
        });
        if (error) throw error;
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (orderId) {
          const { data } = await db.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending").select("id");
          if (data?.length) {
            await db.from("order_status_history").insert({ order_id: orderId, status: "cancelled", note: "Pago no completado" });
          }
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (pi && charge.refunded) {
          const { data } = await db.from("orders").update({ status: "refunded" }).eq("stripe_payment_intent", pi).select("id");
          for (const o of data ?? []) {
            await db.from("order_status_history").insert({ order_id: o.id, status: "refunded", note: "Reembolso completo en Stripe" });
          }
        }
        break;
      }
    }
  } catch (e) {
    console.error("Error procesando webhook", event.type, e);
    // 500 → Stripe reintentará el envío
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
