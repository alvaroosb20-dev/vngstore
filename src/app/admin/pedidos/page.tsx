import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { Order, OrderStatus } from "@/lib/types";
import { Empty, PageHeader, td, th } from "../ui";

export const metadata = { title: "Pedidos" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 30;
  const db = createAdminClient();

  let query = db
    .from("orders")
    .select("id, order_number, email, shipping_name, status, total_cents, created_at, order_items(quantity)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const status = sp.estado as OrderStatus | undefined;
  if (status && status in ORDER_STATUS_LABEL) query = query.eq("status", status);
  else query = query.neq("status", "pending"); // los pendientes son pagos no completados

  const q = sp.q?.trim();
  if (q) {
    if (/^\d+$/.test(q)) query = query.eq("order_number", Number(q));
    else query = query.ilike("email", `%${q.replace(/[%_,()]/g, "")}%`);
  }

  const { data, count } = await query;
  const orders = (data ?? []) as Order[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / perPage));
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.estado ? { estado: sp.estado } : {}), ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Pedidos" subtitle={`${count ?? 0} pedidos`} />
      <form className="mb-5 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Nº de pedido o email…" className="input max-w-xs py-2.5" />
        <select name="estado" defaultValue={sp.estado ?? ""} className="input w-auto py-2.5">
          <option value="">Todos (excepto pendientes de pago)</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn-outline py-2.5">Filtrar</button>
      </form>

      {orders.length === 0 ? (
        <Empty>No hay pedidos con estos filtros.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-espresso/10 bg-cream-50">
              <tr><th className={th}>Pedido</th><th className={th}>Fecha</th><th className={th}>Cliente</th><th className={th}>Artículos</th><th className={th}>Estado</th><th className={th}>Total</th></tr>
            </thead>
            <tbody className="divide-y divide-espresso/10">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-cream-50">
                  <td className={td}><Link href={`/admin/pedidos/${o.id}`} className="font-medium underline-offset-2 hover:underline">#{o.order_number}</Link></td>
                  <td className={td}>{formatDate(o.created_at, true)}</td>
                  <td className={td}><p>{o.shipping_name ?? "—"}</p><p className="text-xs text-espresso-500">{o.email}</p></td>
                  <td className={td}>{o.order_items?.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className={td}><OrderStatusBadge status={o.status} /></td>
                  <td className={td}>{formatPrice(o.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={qs(page - 1)} className="btn-outline py-2">← Anterior</Link>}
          <span>Página {page} de {pages}</span>
          {page < pages && <Link href={qs(page + 1)} className="btn-outline py-2">Siguiente →</Link>}
        </div>
      )}
    </>
  );
}
