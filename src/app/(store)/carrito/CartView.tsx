"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { MinusIcon, PlusIcon, ShieldIcon, TrashIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import type { Quote } from "@/lib/pricing";

export function CartView({ cancelled }: { cancelled: boolean }) {
  const { lines, ready, setQuantity, remove, couponCode, setCouponCode, syncFromServer } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const reqId = useRef(0);

  const key = lines.map((l) => `${l.variantId}:${l.quantity}`).join("|") + `#${couponCode ?? ""}`;

  const refresh = useCallback(async () => {
    if (lines.length === 0) {
      setQuote(null);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    try {
      const res = await fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), couponCode }),
      });
      const data = await res.json();
      if (id !== reqId.current) return;
      if (!res.ok) throw new Error(data.error || "Error al calcular el carrito");
      const q = data as Quote;
      setQuote(q);
      // Sincroniza precios/stock reales con el carrito local
      const next = q.lines.map((ql) => {
        return {
          variantId: ql.variantId,
          productId: ql.productId,
          slug: ql.slug,
          name: ql.name,
          variantLabel: ql.variantLabel,
          image: ql.image,
          unitPriceCents: ql.unitPriceCents,
          quantity: ql.quantity,
          maxStock: ql.stock,
        };
      });
      const changed =
        next.length !== lines.length ||
        next.some((n) => {
          const l = lines.find((x) => x.variantId === n.variantId);
          return !l || l.quantity !== n.quantity || l.unitPriceCents !== n.unitPriceCents || l.maxStock !== n.maxStock;
        });
      if (changed) syncFromServer(next);
    } catch (e) {
      if (id === reqId.current) setError(e instanceof Error ? e.message : "Error");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [ready, refresh]);

  async function checkout() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), couponCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "No se ha podido iniciar el pago");
        if (data.quote) setQuote(data.quote);
        setPaying(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setPaying(false);
    }
  }

  function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (code) setCouponCode(code);
  }

  if (!ready) return <div className="h-64" />;

  if (lines.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-5 px-6 py-24 text-center">
        <p className="font-serif text-3xl text-espresso">Tu cesta está vacía</p>
        {quote?.errors?.map((e) => <p key={e} className="text-sm text-copper-600">{e}</p>)}
        <Link href="/tienda" className="btn-primary">Descubrir la colección</Link>
      </div>
    );
  }

  const remainingFree =
    quote?.freeShippingThresholdCents != null ? quote.freeShippingThresholdCents - (quote.subtotalCents - quote.discountCents) : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
      <div>
        {cancelled && <p className="mb-6 rounded-xl bg-cream-200 p-4 text-sm text-espresso-700">Has cancelado el pago. Tu cesta sigue aquí cuando quieras continuar.</p>}
        {quote?.errors && quote.errors.length > 0 && (
          <div className="mb-6 space-y-1 rounded-xl bg-copper-100 p-4 text-sm text-copper-600">
            {quote.errors.map((e) => <p key={e}>{e}</p>)}
          </div>
        )}
        <ul className="divide-y divide-espresso/10 border-y border-espresso/10">
          {lines.map((l) => (
            <li key={l.variantId} className="flex gap-5 py-6">
              <Link href={`/producto/${l.slug}`} className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                {l.image && <Image src={l.image} alt={l.name} fill sizes="96px" className="object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div>
                    <Link href={`/producto/${l.slug}`} className="font-medium text-espresso">{l.name}</Link>
                    {l.variantLabel && <p className="mt-0.5 text-sm text-espresso-500">{l.variantLabel}</p>}
                    <p className="mt-1 text-sm text-espresso-500">{formatPrice(l.unitPriceCents)} / ud.</p>
                  </div>
                  <p className="font-medium text-espresso">{formatPrice(l.unitPriceCents * l.quantity)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center rounded-full border border-espresso/15">
                    <button className="p-2.5" onClick={() => setQuantity(l.variantId, l.quantity - 1)} aria-label="Restar uno"><MinusIcon /></button>
                    <span className="w-7 text-center text-sm">{l.quantity}</span>
                    <button className="p-2.5 disabled:opacity-30" onClick={() => setQuantity(l.variantId, l.quantity + 1)} disabled={l.quantity >= l.maxStock} aria-label="Sumar uno"><PlusIcon /></button>
                  </div>
                  <button onClick={() => remove(l.variantId)} className="flex items-center gap-1.5 text-sm text-espresso-500 hover:text-rose-700">
                    <TrashIcon /> Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/tienda" className="link-underline mt-6 inline-block text-sm text-espresso">← Seguir comprando</Link>
      </div>

      <aside className="card h-fit p-6 lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl text-espresso">Resumen</h2>

        <form onSubmit={applyCoupon} className="mt-6">
          <label className="label" htmlFor="coupon">Código promocional</label>
          {couponCode && quote?.coupon ? (
            <div className="flex items-center justify-between rounded-xl bg-cream-100 px-4 py-3 text-sm">
              <span><strong>{quote.coupon.code}</strong> aplicado</span>
              <button type="button" onClick={() => setCouponCode(null)} className="text-espresso-500 underline">Quitar</button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input id="coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} className="input py-2.5 uppercase" placeholder="CÓDIGO" maxLength={40} />
                <button className="btn-outline px-5 py-2.5" disabled={!couponInput.trim()}>Aplicar</button>
              </div>
              {couponCode && quote?.couponError && (
                <p className="mt-2 text-sm text-rose-700">
                  {quote.couponError}{" "}
                  <button type="button" onClick={() => setCouponCode(null)} className="underline">Quitar</button>
                </p>
              )}
            </>
          )}
        </form>

        <dl className={`mt-6 space-y-3 text-sm transition ${loading ? "opacity-50" : ""}`}>
          <div className="flex justify-between"><dt className="text-espresso-500">Subtotal</dt><dd>{quote ? formatPrice(quote.subtotalCents) : "—"}</dd></div>
          {quote && quote.discountCents > 0 && (
            <div className="flex justify-between text-copper-600"><dt>Descuento</dt><dd>-{formatPrice(quote.discountCents)}</dd></div>
          )}
          <div className="flex justify-between">
            <dt className="text-espresso-500">Envío</dt>
            <dd>{quote ? (quote.shippingCents === 0 ? "Gratis" : formatPrice(quote.shippingCents)) : "—"}</dd>
          </div>
          {remainingFree != null && remainingFree > 0 && (
            <p className="rounded-lg bg-cream-100 px-3 py-2 text-xs text-espresso-700">Te faltan {formatPrice(remainingFree)} para el envío gratis.</p>
          )}
          <div className="flex justify-between border-t border-espresso/10 pt-4 text-base">
            <dt className="font-medium text-espresso">Total</dt>
            <dd className="font-serif text-2xl text-espresso">{quote ? formatPrice(quote.totalCents) : "—"}</dd>
          </div>
          <p className="text-xs text-espresso-300">IVA incluido</p>
        </dl>

        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

        <button onClick={checkout} disabled={paying || loading || !quote || quote.lines.length === 0} className="btn-primary mt-6 w-full py-4">
          {paying ? "Redirigiendo al pago seguro…" : "Pagar de forma segura"}
        </button>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-espresso-500">
          <ShieldIcon className="h-4 w-4" /> Tarjeta, Apple Pay y Google Pay con Stripe
        </p>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-espresso-300">
          Al pagar aceptas las <Link href="/condiciones" className="underline">condiciones de compra</Link> y la{" "}
          <Link href="/privacidad" className="underline">política de privacidad</Link>.
        </p>
      </aside>
    </div>
  );
}
