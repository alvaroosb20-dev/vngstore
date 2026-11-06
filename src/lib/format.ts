import type { OrderStatus } from "./types";

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function formatPrice(cents: number) {
  return eur.format(cents / 100);
}

export function formatDate(iso: string, withTime = false) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Europe/Madrid",
  }).format(new Date(iso));
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente de pago",
  paid: "Pagado",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-cream-200 text-espresso-500",
  paid: "bg-copper-100 text-copper-600",
  processing: "bg-amber-100 text-amber-800",
  shipped: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-600",
  refunded: "bg-rose-100 text-rose-800",
};

export function variantLabel(v: { size: string | null; color: string | null }) {
  return [v.size, v.color].filter(Boolean).join(" · ");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Convierte "12,50" o "12.50" a céntimos. Devuelve null si no es válido. */
export function parseEurosToCents(input: string | null | undefined): number | null {
  if (input == null) return null;
  const s = String(input).trim().replace(/\s|€/g, "").replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function centsToInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}
