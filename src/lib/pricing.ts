import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { variantLabel } from "@/lib/format";
import type { Coupon, Settings } from "@/lib/types";
import { isPreview } from "@/lib/config";

export const cartInputSchema = z.object({
  items: z
    .array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20) }))
    .min(1, "El carrito está vacío")
    .max(50),
  couponCode: z.string().trim().max(40).optional().nullable(),
});
export type CartInput = z.infer<typeof cartInputSchema>;

export interface QuoteLine {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  variantLabel: string;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
  stock: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  coupon: Pick<Coupon, "code" | "type" | "value"> | null;
  couponError: string | null;
  freeShippingThresholdCents: number | null;
  errors: string[];
}

export async function getSettings(): Promise<Settings> {
  if (isPreview()) return { shipping_cents: 0, free_shipping_threshold_cents: null };
  const db = createAdminClient();
  const { data } = await db.from("settings").select("shipping_cents, free_shipping_threshold_cents").eq("id", 1).single();
  return { shipping_cents: data?.shipping_cents ?? 0, free_shipping_threshold_cents: data?.free_shipping_threshold_cents ?? null };
}

export function couponDiscount(coupon: Coupon, subtotalCents: number): { discount: number; error: string | null } {
  const now = Date.now();
  if (!coupon.active) return { discount: 0, error: "Este código ya no está activo" };
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) return { discount: 0, error: "Este código aún no está disponible" };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) return { discount: 0, error: "Este código ha caducado" };
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) return { discount: 0, error: "Este código ha alcanzado su límite de usos" };
  if (subtotalCents < coupon.min_order_cents)
    return { discount: 0, error: `Pedido mínimo de ${(coupon.min_order_cents / 100).toFixed(2).replace(".", ",")} € para este código` };
  const raw = coupon.type === "percent" ? Math.round((subtotalCents * coupon.value) / 100) : coupon.value;
  return { discount: Math.min(raw, subtotalCents), error: null };
}

/** Recalcula el carrito con los precios y el stock reales de la base de datos. Nunca confía en el navegador. */
export async function quoteCart(input: CartInput): Promise<Quote> {
  if (isPreview()) {
    return { lines: [], subtotalCents: 0, discountCents: 0, shippingCents: 0, totalCents: 0, coupon: null, couponError: null, freeShippingThresholdCents: null, errors: ["La tienda está en modo vista previa: aún no se pueden hacer pedidos."] };
  }
  const db = createAdminClient();
  const ids = Array.from(new Set(input.items.map((i) => i.variantId)));

  const { data: variants, error } = await db
    .from("product_variants")
    .select("id, size, color, stock, price_cents, product_id, products!inner(id, name, slug, price_cents, status, product_images(url, position))")
    .in("id", ids);
  if (error) throw new Error(error.message);

  const errors: string[] = [];
  const lines: QuoteLine[] = [];

  // Agrupa cantidades por variante
  const qty = new Map<string, number>();
  for (const i of input.items) qty.set(i.variantId, (qty.get(i.variantId) ?? 0) + i.quantity);

  for (const [variantId, quantity] of qty) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (variants ?? []).find((x: any) => x.id === variantId) as any;
    if (!v || v.products.status !== "active") {
      errors.push("Un producto de tu carrito ya no está disponible y se ha retirado.");
      continue;
    }
    const unit = v.price_cents ?? v.products.price_cents;
    if (!unit || unit <= 0) {
      errors.push(`«${v.products.name}» no está a la venta en este momento.`);
      continue;
    }
    if (v.stock <= 0) {
      errors.push(`«${v.products.name}» (${variantLabel(v)}) está agotado.`);
      continue;
    }
    const finalQty = Math.min(quantity, v.stock);
    if (finalQty < quantity) errors.push(`Solo quedan ${v.stock} unidades de «${v.products.name}» (${variantLabel(v)}).`);
    const images = [...(v.products.product_images ?? [])].sort((a: { position: number }, b: { position: number }) => a.position - b.position);
    lines.push({
      productId: v.products.id,
      variantId,
      name: v.products.name,
      slug: v.products.slug,
      variantLabel: variantLabel(v),
      image: images[0]?.url ?? null,
      unitPriceCents: unit,
      quantity: finalQty,
      stock: v.stock,
    });
  }

  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);

  let discountCents = 0;
  let coupon: Quote["coupon"] = null;
  let couponError: string | null = null;
  const code = input.couponCode?.trim().toUpperCase();
  if (code) {
    const { data: c } = await db.from("coupons").select("*").eq("code", code).maybeSingle();
    if (!c) couponError = "Código no válido";
    else {
      const r = couponDiscount(c as Coupon, subtotalCents);
      if (r.error) couponError = r.error;
      else {
        discountCents = r.discount;
        coupon = { code: c.code, type: c.type, value: c.value };
      }
    }
  }

  const settings = await getSettings();
  const afterDiscount = subtotalCents - discountCents;
  const free = settings.free_shipping_threshold_cents != null && afterDiscount >= settings.free_shipping_threshold_cents;
  const shippingCents = lines.length === 0 || free ? 0 : settings.shipping_cents;

  return {
    lines,
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: afterDiscount + shippingCents,
    coupon,
    couponError,
    freeShippingThresholdCents: settings.free_shipping_threshold_cents,
    errors,
  };
}
