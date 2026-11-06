"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./CartProvider";
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { lines, drawerOpen, closeDrawer, setQuantity, remove, subtotalCents, count } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrito">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={closeDrawer} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream-50 shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between border-b border-espresso/10 px-6 py-5">
          <h2 className="font-serif text-2xl text-espresso">
            Tu cesta <span className="text-base text-espresso-300">({count})</span>
          </h2>
          <button onClick={closeDrawer} className="btn-ghost -mr-3" aria-label="Cerrar carrito">
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="font-serif text-2xl text-espresso">Tu cesta está vacía</p>
            <p className="text-sm text-espresso-500">Descubre la colección y encuentra tu próxima pieza favorita.</p>
            <Link href="/tienda" onClick={closeDrawer} className="btn-primary">
              Ver la tienda
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-espresso/10 overflow-y-auto px-6">
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-4 py-5">
                  <Link href={`/producto/${l.slug}`} onClick={closeDrawer} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                    {l.image && <Image src={l.image} alt={l.name} fill sizes="80px" className="object-cover" />}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-medium text-espresso">{l.name}</p>
                        {l.variantLabel && <p className="text-xs text-espresso-500">{l.variantLabel}</p>}
                      </div>
                      <p className="text-sm text-espresso">{formatPrice(l.unitPriceCents * l.quantity)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-espresso/15">
                        <button className="p-2" onClick={() => setQuantity(l.variantId, l.quantity - 1)} aria-label="Restar uno">
                          <MinusIcon />
                        </button>
                        <span className="w-6 text-center text-sm">{l.quantity}</span>
                        <button
                          className="p-2 disabled:opacity-30"
                          onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                          disabled={l.quantity >= l.maxStock}
                          aria-label="Sumar uno"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                      <button onClick={() => remove(l.variantId)} className="p-2 text-espresso-300 hover:text-rose-700" aria-label="Eliminar">
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-espresso/10 px-6 py-6">
              <div className="flex justify-between text-sm">
                <span className="text-espresso-500">Subtotal</span>
                <span className="font-medium text-espresso">{formatPrice(subtotalCents)}</span>
              </div>
              <p className="mt-1 text-xs text-espresso-300">IVA incluido. Envío y descuentos en el siguiente paso.</p>
              <Link href="/carrito" onClick={closeDrawer} className="btn-primary mt-5 w-full">
                Tramitar pedido
              </Link>
              <button onClick={closeDrawer} className="mt-2 w-full py-2 text-sm text-espresso-500 hover:text-espresso">
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
