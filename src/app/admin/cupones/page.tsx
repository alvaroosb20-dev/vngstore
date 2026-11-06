import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";
import type { Coupon } from "@/lib/types";
import { deleteCoupon, toggleCoupon } from "../actions";
import { Empty, PageHeader, td, th } from "../ui";
import { CouponForm } from "./CouponForm";

export const metadata = { title: "Cupones" };

export default async function AdminCoupons() {
  await requireAdmin();
  const { data } = await createAdminClient().from("coupons").select("*").order("created_at", { ascending: false });
  const coupons = (data ?? []) as Coupon[];
  const now = new Date().toISOString();

  return (
    <>
      <PageHeader title="Cupones" subtitle="Los clientes los aplican en la cesta. El descuento se valida siempre en el servidor." />
      <CouponForm />
      <div className="mt-6">
        {coupons.length === 0 ? (
          <Empty>Aún no has creado cupones.</Empty>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-espresso/10 bg-cream-50">
                <tr><th className={th}>Código</th><th className={th}>Descuento</th><th className={th}>Condiciones</th><th className={th}>Usos</th><th className={th}>Estado</th><th className={th}></th></tr>
              </thead>
              <tbody className="divide-y divide-espresso/10">
                {coupons.map((c) => {
                  const expired = c.expires_at != null && c.expires_at < now;
                  const exhausted = c.max_uses != null && c.used_count >= c.max_uses;
                  return (
                    <tr key={c.id}>
                      <td className={`${td} font-mono font-medium`}>{c.code}</td>
                      <td className={td}>{c.type === "percent" ? `${c.value}%` : formatPrice(c.value)}</td>
                      <td className={`${td} text-xs text-espresso-500`}>
                        {c.min_order_cents > 0 && <p>Mínimo {formatPrice(c.min_order_cents)}</p>}
                        {c.starts_at && <p>Desde {formatDate(c.starts_at)}</p>}
                        {c.expires_at && <p>Hasta {formatDate(c.expires_at)}</p>}
                        {!c.min_order_cents && !c.starts_at && !c.expires_at && "—"}
                      </td>
                      <td className={td}>{c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ""}</td>
                      <td className={td}>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] ${c.active && !expired && !exhausted ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
                          {!c.active ? "Desactivado" : expired ? "Caducado" : exhausted ? "Agotado" : "Activo"}
                        </span>
                      </td>
                      <td className={`${td} whitespace-nowrap text-right`}>
                        <form action={toggleCoupon} className="inline">
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="active" value={String(c.active)} />
                          <button className="underline">{c.active ? "Desactivar" : "Activar"}</button>
                        </form>
                        <form action={deleteCoupon} className="ml-4 inline">
                          <input type="hidden" name="id" value={c.id} />
                          <button className="text-rose-700 underline">Eliminar</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
