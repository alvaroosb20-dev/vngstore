"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { MinusIcon, PlusIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const variants = useMemo(() => product.product_variants ?? [], [product.product_variants]);
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[];

  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [size, setSize] = useState<string | null>(firstAvailable?.size ?? null);
  const [color, setColor] = useState<string | null>(firstAvailable?.color ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => (sizes.length ? v.size === size : true) && (colors.length ? v.color === color : true));
  const price = variant?.price_cents ?? product.price_cents;
  const stock = variant?.stock ?? 0;
  const purchasable = !!variant && stock > 0 && price > 0;

  function stockFor(opts: { size?: string; color?: string }) {
    return variants
      .filter((v) => (opts.size ? v.size === opts.size : true) && (opts.color ? v.color === opts.color : true))
      .reduce((s, v) => s + v.stock, 0);
  }

  function handleAdd() {
    if (!variant || !purchasable) return;
    add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantLabel: [variant.size, variant.color].filter(Boolean).join(" · "),
        image: product.product_images?.[0]?.url ?? null,
        unitPriceCents: price,
        maxStock: stock,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  const showSizes = sizes.length > 1 || (sizes.length === 1 && sizes[0] !== "Única");
  const comingSoon = product.price_cents <= 0 && !variants.some((v) => (v.price_cents ?? 0) > 0);

  return (
    <div className="space-y-7">
      {comingSoon ? (
        <p className="text-2xl text-espresso-500">Próximamente</p>
      ) : (
      <div className="flex items-baseline gap-3">
        <span className={`text-2xl ${product.compare_at_cents && product.compare_at_cents > price ? "text-copper-600" : "text-espresso"}`}>{formatPrice(price)}</span>
        {product.compare_at_cents != null && product.compare_at_cents > price && (
          <span className="text-base text-espresso-300 line-through">{formatPrice(product.compare_at_cents)}</span>
        )}
        <span className="text-xs text-espresso-300">IVA incluido</span>
      </div>
      )}

      {colors.length > 1 && (
        <div>
          <p className="label">
            Color: <span className="normal-case tracking-normal text-espresso">{color}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                disabled={!comingSoon && stockFor({ color: c }) === 0}
                className={`rounded-full border px-4 py-2 text-sm transition disabled:opacity-35 disabled:line-through ${c === color ? "border-espresso bg-espresso text-cream-50" : "border-espresso/20 hover:border-espresso"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSizes && (
        <div>
          <p className="label">Talla</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const out = !comingSoon && stockFor({ size: s, color: color ?? undefined }) === 0;
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  disabled={out}
                  className={`min-w-[52px] rounded-full border px-4 py-2.5 text-sm transition disabled:opacity-35 disabled:line-through ${s === size ? "border-espresso bg-espresso text-cream-50" : "border-espresso/20 hover:border-espresso"}`}
                  aria-label={`Talla ${s}${out ? " (agotada)" : ""}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!comingSoon && (
      <p className={`text-sm ${stock > 0 ? (stock <= 3 ? "text-copper-600" : "text-emerald-700") : "text-rose-700"}`}>
        {stock > 5 ? "● En stock" : stock > 0 ? `● ¡Solo quedan ${stock}!` : "● Agotado"}
      </p>
      )}

      <div className="flex gap-3">
        <div className="flex items-center rounded-full border border-espresso/20">
          <button className="p-3.5" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Restar uno">
            <MinusIcon />
          </button>
          <span className="w-6 text-center">{qty}</span>
          <button className="p-3.5 disabled:opacity-30" onClick={() => setQty((q) => Math.min(stock, 20, q + 1))} disabled={qty >= stock} aria-label="Sumar uno">
            <PlusIcon />
          </button>
        </div>
        <button onClick={handleAdd} disabled={!purchasable} className="btn-primary flex-1 py-4">
          {comingSoon ? "Disponible muy pronto" : !purchasable ? "No disponible" : added ? "✓ Añadido a la cesta" : "Añadir a la cesta"}
        </button>
      </div>
    </div>
  );
}
