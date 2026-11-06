import { requireAdmin } from "@/lib/auth";
import { rows } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { deleteSubscriber } from "../actions";
import { Empty, PageHeader, td, th } from "../ui";

export const metadata = { title: "Newsletter" };

export default async function AdminNewsletter() {
  await requireAdmin();
  const { data, count } = await createAdminClient()
    .from("newsletter_subscribers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(1000);
  const subs = rows<{ id: string; email: string; created_at: string }>(data);

  return (
    <>
      <PageHeader title="Newsletter" subtitle={`${count ?? 0} suscriptores con consentimiento`}>
        {subs.length > 0 && <a href="/admin/newsletter/csv" className="btn-outline py-2.5">Descargar CSV</a>}
      </PageHeader>
      <p className="mb-5 text-sm text-espresso-500">Si alguien pide darse de baja, elimínalo de la lista.</p>
      {subs.length === 0 ? (
        <Empty>Aún no hay suscriptores.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-espresso/10 bg-cream-50"><tr><th className={th}>Email</th><th className={th}>Fecha</th><th className={th}></th></tr></thead>
            <tbody className="divide-y divide-espresso/10">
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className={td}>{s.email}</td>
                  <td className={td}>{formatDate(s.created_at)}</td>
                  <td className={`${td} text-right`}>
                    <form action={deleteSubscriber}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-rose-700 underline">Dar de baja</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
