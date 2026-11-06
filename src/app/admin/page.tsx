import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, variantLabel } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { rows, type OrderStatus } from "@/lib/types";
import { PageHeader, Stat, td, th } from "./ui";

export const metadata = { title: "Resumen" };

const PAID: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

export default async function AdminDashboard() {
  await requireAdmin();
  const db = createAdminClient();
  const since = new Date(Date.now() - 30 * 86400000);
  since.setHours(0, 0, 0, 0);

  const [{ data: paidOrders }, { data: recent }, { data: lowStock }, { count: customers }, { count: toShip }, { count: drafts }] = await Promise.all([
    db.from("orders").select("total_cents, created_at, status").in("status", PAID).limit(10000),
    db.from("orders").select("id, order_number, email, status, total_cents, created_at").neq("status", "pending").order("created_at", { ascending: false }).limit(8),
    db.from("product_variants").select("id, size, color, stock, products!inner(id, name, status)").lte("stock", 3).eq("products.status", "active").order("stock").limit(10),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    db.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "processing"]),
    db.from("products").select("id", { count: "exact", head: true }).eq("status", "draft"),
  ]);

  const orders = rows<{ total_cents: number; created_at: string; status: string }>(paidOrders);
  const revenueTotal = orders.reduce((s, o) => s + o.total_cents, 0);
  const last30 = orders.filter((o) => new Date(o.created_at) >= since);
  const revenue30 = last30.reduce((s, o) => s + o.total_cents, 0);
  const avg = orders.length ? Math.round(revenueTotal / orders.length) : 0;

  // Ingresos por día (últimos 30 días)
  const days: { key: string; label: string; cents: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, label: d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }), cents: 0 });
  }
  for (const o of last30) {
    const day = days.find((d) => d.key === o.created_at.slice(0, 10));
    if (day) day.cents += o.total_cents;
  }
  const max = Math.max(...days.map((d) => d.cents), 1);

  // Productos más vendidos
  const { data: top } = await db.from("products").select("id, name, sales_count").gt("sales_count", 0).order("sales_count", { ascending: false }).limit(5);

  return (
    <>
      <PageHeader title="Resumen" subtitle="Ventas confirmadas por Stripe (pedidos pagados, en preparación, enviados y entregados)." />

      {(drafts ?? 0) > 0 && (
        <Link href="/admin/productos" className="mb-6 block rounded-2xl bg-copper-100 p-4 text-sm text-copper-600">
          Tienes {drafts} producto(s) en borrador que no se ven en la tienda. Ponles precio y stock y márcalos como «Publicado». →
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Ingresos (30 días)" value={formatPrice(revenue30)} hint={`${last30.length} pedidos`} />
        <Stat label="Ingresos totales" value={formatPrice(revenueTotal)} hint={`${orders.length} pedidos`} />
        <Stat label="Ticket medio" value={formatPrice(avg)} />
        <Stat label="Pendientes de enviar" value={String(toShip ?? 0)} hint={`${customers ?? 0} clientes registrados`} />
      </div>

      <div className="card mt-6 p-6">
        <p className="text-sm font-medium text-espresso">Ingresos diarios · últimos 30 días</p>
        <div className="mt-6 flex h-44 items-end gap-[3px]" role="img" aria-label="Gráfico de ingresos diarios">
          {days.map((d) => (
            <div key={d.key} className="group relative flex h-full flex-1 items-end">
              <div className="w-full rounded-t bg-espresso/80 transition group-hover:bg-copper" style={{ height: `${d.cents ? Math.max((d.cents / max) * 100, 3) : 1}%` }} />
              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] text-white group-hover:block">
                {d.label}: {formatPrice(d.cents)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-espresso-300">
          <span>{days[0].label}</span>
          <span>Hoy</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <p className="text-sm font-medium text-espresso">Últimos pedidos</p>
            <Link href="/admin/pedidos" className="text-xs underline">Ver todos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-espresso/10 bg-cream-50"><tr><th className={th}>Nº</th><th className={th}>Cliente</th><th className={th}>Estado</th><th className={th}>Total</th></tr></thead>
              <tbody className="divide-y divide-espresso/10">
                {rows<{ id: string; order_number: number; email: string; status: OrderStatus; total_cents: number; created_at: string }>(recent).map((o) => (
                  <tr key={o.id} className="hover:bg-cream-50">
                    <td className={td}><Link href={`/admin/pedidos/${o.id}`} className="font-medium underline-offset-2 hover:underline">#{o.order_number}</Link><p className="text-xs text-espresso-300">{formatDate(o.created_at)}</p></td>
                    <td className={`${td} max-w-[180px] truncate`}>{o.email}</td>
                    <td className={td}><OrderStatusBadge status={o.status} /></td>
                    <td className={td}>{formatPrice(o.total_cents)}</td>
                  </tr>
                ))}
                {(recent ?? []).length === 0 && <tr><td className={`${td} text-espresso-500`} colSpan={4}>Aún no hay pedidos.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <p className="text-sm font-medium text-espresso">Stock bajo (≤ 3)</p>
            <ul className="mt-3 divide-y divide-espresso/10 text-sm">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(lowStock ?? []).map((v: any) => (
                <li key={v.id} className="flex justify-between py-2">
                  <Link href={`/admin/productos/${v.products.id}`} className="hover:underline">{v.products.name} <span className="text-espresso-500">{variantLabel(v)}</span></Link>
                  <span className={v.stock === 0 ? "text-rose-700" : "text-copper-600"}>{v.stock}</span>
                </li>
              ))}
              {(lowStock ?? []).length === 0 && <li className="py-2 text-espresso-500">Todo en orden.</li>}
            </ul>
          </div>
          <div className="card p-5">
            <p className="text-sm font-medium text-espresso">Más vendidos</p>
            <ul className="mt-3 divide-y divide-espresso/10 text-sm">
              {rows<{ id: string; name: string; sales_count: number }>(top).map((p) => (
                <li key={p.id} className="flex justify-between py-2"><Link href={`/admin/productos/${p.id}`} className="hover:underline">{p.name}</Link><span>{p.sales_count} uds.</span></li>
              ))}
              {(top ?? []).length === 0 && <li className="py-2 text-espresso-500">Sin ventas todavía.</li>}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
