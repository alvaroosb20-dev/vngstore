import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { cartInputSchema, quoteCart } from "@/lib/pricing";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { site } from "@/lib/config";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = cartInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const quote = await quoteCart(parsed.data);
  if (quote.lines.length === 0) {
    return NextResponse.json({ error: quote.errors[0] ?? "Tu carrito está vacío" }, { status: 409 });
  }
  if (quote.errors.length > 0) {
    // Algo cambió (stock/precio): el cliente debe revisar el carrito antes de pagar.
    return NextResponse.json({ error: quote.errors.join(" "), quote }, { status: 409 });
  }
  if (parsed.data.couponCode && quote.couponError) {
    return NextResponse.json({ error: quote.couponError, quote }, { status: 409 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const db = createAdminClient();

  // 1) Crear el pedido pendiente con los importes calculados en servidor
  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      email: user?.email ?? "pendiente@checkout",
      status: "pending",
      subtotal_cents: quote.subtotalCents,
      discount_cents: quote.discountCents,
      shipping_cents: quote.shippingCents,
      total_cents: quote.totalCents,
      coupon_code: quote.coupon?.code ?? null,
    })
    .select("id, order_number")
    .single();
  if (orderError || !order) return NextResponse.json({ error: "No se ha podido crear el pedido" }, { status: 500 });

  const { error: itemsError } = await db.from("order_items").insert(
    quote.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      variant_id: l.variantId,
      product_name: l.name,
      variant_label: l.variantLabel || null,
      image_url: l.image,
      unit_price_cents: l.unitPriceCents,
      quantity: l.quantity,
    })),
  );
  if (itemsError) {
    await db.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "No se ha podido crear el pedido" }, { status: 500 });
  }

  // 2) Crear la sesión de Stripe Checkout (tarjeta, Apple Pay y Google Pay)
  const base = process.env.NEXT_PUBLIC_SITE_URL ? site.url : new URL(req.url).origin;
  const absolute = (url: string | null) => (url ? (url.startsWith("http") ? url : `${base}${url}`) : undefined);

  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  if (quote.discountCents > 0) {
    const coupon = await stripe().coupons.create({
      amount_off: quote.discountCents,
      currency: "eur",
      duration: "once",
      max_redemptions: 1,
      name: `Código ${quote.coupon?.code ?? ""}`.trim(),
    });
    discounts.push({ coupon: coupon.id });
  }

  // Clientes registrados: usamos un Customer de Stripe con su dirección principal precargada
  let customerId: string | undefined;
  if (user) {
    try {
      customerId = await ensureStripeCustomer(user.id, user.email ?? undefined);
    } catch (e) {
      console.error("No se pudo preparar el cliente de Stripe", e);
    }
  }

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      locale: "es",
      currency: "eur",
      ...(customerId
        ? { customer: customerId, customer_update: { shipping: "auto" as const, name: "auto" as const } }
        : { customer_email: user?.email ?? undefined }),
      client_reference_id: order.id,
      metadata: { order_id: order.id, order_number: String(order.order_number) },
      payment_intent_data: { metadata: { order_id: order.id, order_number: String(order.order_number) } },
      line_items: quote.lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: "eur",
          unit_amount: l.unitPriceCents,
          product_data: {
            name: l.name,
            description: l.variantLabel || undefined,
            images: absolute(l.image) && absolute(l.image)!.startsWith("https") ? [absolute(l.image)!] : undefined,
            metadata: { variant_id: l.variantId },
          },
        },
      })),
      discounts: discounts.length ? discounts : undefined,
      shipping_address_collection: { allowed_countries: ["ES"] },
      phone_number_collection: { enabled: true },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: quote.shippingCents === 0 ? "Envío gratuito" : "Envío estándar",
            fixed_amount: { amount: quote.shippingCents, currency: "eur" },
          },
        },
      ],
      success_url: `${base}/pedido/completado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/carrito?cancelado=1`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hora
    });

    await db.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    await db.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    const message = e instanceof Error ? e.message : "Error con la pasarela de pago";
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: "No se ha podido iniciar el pago. Inténtalo de nuevo." }, { status: 502 });
  }
}

async function ensureStripeCustomer(userId: string, email?: string): Promise<string> {
  const db = createAdminClient();
  const [{ data: profile }, { data: address }] = await Promise.all([
    db.from("profiles").select("full_name, phone, stripe_customer_id").eq("id", userId).single(),
    db.from("addresses").select("*").eq("user_id", userId).order("is_default", { ascending: false }).order("created_at").limit(1).maybeSingle(),
  ]);

  const shipping: Stripe.CustomerCreateParams.Shipping | undefined = address
    ? {
        name: address.full_name,
        phone: address.phone ?? profile?.phone ?? undefined,
        address: {
          line1: address.line1,
          line2: address.line2 ?? undefined,
          city: address.city,
          state: address.province,
          postal_code: address.postal_code,
          country: address.country ?? "ES",
        },
      }
    : undefined;

  if (profile?.stripe_customer_id) {
    if (shipping) await stripe().customers.update(profile.stripe_customer_id, { shipping });
    return profile.stripe_customer_id;
  }

  const customer = await stripe().customers.create({
    email,
    name: profile?.full_name || undefined,
    phone: profile?.phone || undefined,
    shipping,
    metadata: { supabase_user_id: userId },
  });
  await db.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}
