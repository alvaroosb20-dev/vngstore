import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/product/Stars";
import type { Review } from "@/lib/types";
import { moderateReview } from "../actions";
import { Empty, PageHeader } from "../ui";

export const metadata = { title: "Valoraciones" };

export default async function AdminReviews({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const showApproved = sp.ver === "publicadas";
  const { data } = await createAdminClient()
    .from("reviews")
    .select("*, products(name, slug)")
    .eq("approved", showApproved)
    .order("created_at", { ascending: false })
    .limit(200);
  const reviews = (data ?? []) as Review[];

  return (
    <>
      <PageHeader title="Valoraciones" subtitle="Solo pueden valorar clientes que han comprado el producto. Se publican cuando las apruebas." />
      <div className="mb-5 flex gap-2 text-sm">
        <Link href="/admin/valoraciones" className={`rounded-full px-4 py-2 ${!showApproved ? "bg-espresso text-cream-50" : "bg-white"}`}>Pendientes</Link>
        <Link href="/admin/valoraciones?ver=publicadas" className={`rounded-full px-4 py-2 ${showApproved ? "bg-espresso text-cream-50" : "bg-white"}`}>Publicadas</Link>
      </div>
      {reviews.length === 0 ? (
        <Empty>{showApproved ? "No hay valoraciones publicadas." : "No hay valoraciones pendientes."}</Empty>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <Stars value={r.rating} />
                  <span className="text-xs text-espresso-500">{r.author_name} · {formatDate(r.created_at)}</span>
                </div>
                {r.products && <p className="mt-1 text-xs text-espresso-500">{r.products.name}</p>}
                {r.title && <p className="mt-2 font-medium text-espresso">{r.title}</p>}
                <p className="mt-1 text-sm text-espresso-700">{r.body}</p>
              </div>
              <div className="flex gap-2">
                <form action={moderateReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="action" value={showApproved ? "hide" : "approve"} />
                  <button className="btn-outline py-2">{showApproved ? "Ocultar" : "Aprobar"}</button>
                </form>
                <form action={moderateReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="action" value="delete" />
                  <button className="btn-ghost py-2 text-rose-700">Eliminar</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
