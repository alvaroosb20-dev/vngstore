"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine } from "@/lib/types";

const KEY = "vng-cart-v1";
const COUPON_KEY = "vng-coupon-v1";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  couponCode: string | null;
  ready: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  setCouponCode: (code: string | null) => void;
  syncFromServer: (lines: CartLine[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [couponCode, setCoupon] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setLines(read<CartLine[]>(KEY, []).filter((l) => l && l.variantId && l.quantity > 0));
    setCoupon(read<string | null>(COUPON_KEY, null));
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setLines(read<CartLine[]>(KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (ready) write(KEY, lines);
  }, [lines, ready]);

  useEffect(() => {
    if (ready) write(COUPON_KEY, couponCode);
  }, [couponCode, ready]);

  const add = useCallback<CartContextValue["add"]>((line, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === line.variantId);
      if (existing) {
        return prev.map((l) =>
          l.variantId === line.variantId
            ? { ...l, ...line, quantity: Math.min(l.quantity + quantity, line.maxStock, 20) }
            : l,
        );
      }
      return [...prev, { ...line, quantity: Math.min(quantity, line.maxStock, 20) }];
    });
    setDrawerOpen(true);
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(0, Math.min(quantity, l.maxStock, 20)) } : l))
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setCoupon(null);
  }, []);

  const syncFromServer = useCallback((next: CartLine[]) => setLines(next), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotalCents: lines.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0),
      couponCode,
      ready,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      add,
      setQuantity,
      remove,
      clear,
      setCouponCode: setCoupon,
      syncFromServer,
    }),
    [lines, couponCode, ready, drawerOpen, add, setQuantity, remove, clear, syncFromServer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
