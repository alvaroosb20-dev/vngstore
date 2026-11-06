import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";
import { Empty, PageHeader, td, th } from "../ui";

export const metadata = { title: "Clientes" };

const PAID = ["paid", "processing", "shipped", "delivered"];

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = createAdminClient();

  let pq = db.from("profiles").select("id, email, full_name, phone, role, created_at").order("created_at", { ascending: false }).limit(500);
  const q = sp.q?.trim().replace(/[%_,()]/g, "");
  if (q) pq = pq.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);

  const [{ data: profiles }, { data: orders }] = await Promise.all([
    pq,
    db.from("orders").select("user_id, email, total_cents, created_at, shipping_name").in("status", PAID).limit(10000),
  ]);

  // Agrega pedidos por email (incluye compras como invitado)
  const byEmail = new Map<string, { name: string | null; count: number; total: number; last: string; registered: boolean; id?: string; phone?: string | null }>();
  for (const p of profiles ?? []) {
    if (!p.email) continue;
    byEmail.set(p.email.toLowerCase(), { name: p.full_name, count: 0, total: 0, last: p.created_at, registered: true, id: p.id, phone: p.phone });
  }
  for (const o of orders ?? []) {
    const key = String(o.email).toLowerCase();
    if (q && !key.includes(q.toLowerCase()) && !(o.shipping_name ?? "").toLowerCase().includes(q.toLowerCase())) continue;
    const c = byEmail.get(key) ?? { name: o.shipping_name, count: 0, total: 0, last: o.created_at, registered: false };
    c.count += 1;
    c.total += o.total_cents;
    if (o.created_at > c.last) c.last = o.created_at;
    if (!c.name) c.name = o.shipping_name;
    byEmail.set(key, c);
  }
  const rows = Array.from(byEmail.entries()).sort((a, b) => b[1].total - a[1].total || b[1].last.localeCompare(a[1].last));

  return (
    <>
      <PageHeader title="Clientes" subtitle={`${rows.length} clientes (registrados y compras como invitado)`} />
      <form className="mb-5 flex gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Nombre o email…" className="input max-w-xs py-2.5" />
        <button className="btn-outline py-2.5">Buscar</button>
      </form>
      {rows.length === 0 ? (
        <Empty>Aún no hay clientes.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-espresso/10 bg-cream-50">
              <tr><th className={th}>Cliente</th><th className={th}>Tipo</th><th className={th}>Pedidos</th><th className={th}>Gastado</th><th className={th}>Última actividad</th></tr>
            </thead>
            <tbody className="divide-y divide-espresso/10">
              {rows.map(([email, c]) => (
                <tr key={email} className="hover:bg-cream-50">
                  <td className={td}>
                    <p className="text-espresso">{c.name || "—"}</p>
                    <Link href={`/admin/pedidos?q=${encodeURIComponent(email)}`} className="text-xs text-espresso-500 underline-offset-2 hover:underline">{email}</Link>
                    {c.phone && <p className="text-xs text-espresso-500">{c.phone}</p>}
                  </td>
                  <td className={td}>{c.registered ? "Registrado" : "Invitado"}</td>
                  <td className={td}>{c.count}</td>
                  <td className={td}>{formatPrice(c.total)}</td>
                  <td className={td}>{formatDate(c.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
