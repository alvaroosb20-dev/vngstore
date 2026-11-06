import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Empty, PageHeader, td, th } from "../ui";

export const metadata = { title: "Productos" };

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Publicado", cls: "bg-emerald-100 text-emerald-800" },
  draft: { label: "Borrador", cls: "bg-cream-200 text-espresso-500" },
  archived: { label: "Archivado", cls: "bg-stone-200 text-stone-600" },
};

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = createAdminClient();
  let query = db.from("products").select("*, categories(name), product_images(url, position), product_variants(stock)").order("created_at", { ascending: false });
  if (sp.estado && ["active", "draft", "archived"].includes(sp.estado)) query = query.eq("status", sp.estado);
  if (sp.q) query = query.ilike("name", `%${sp.q.replace(/[%_]/g, "")}%`);
  const { data } = await query;
  const products = (data ?? []) as (Product & { categories: { name: string } | null })[];

  return (
    <>
      <PageHeader title="Productos" subtitle={`${products.length} productos`}>
        <Link href="/admin/productos/nuevo" className="btn-primary">+ Nuevo producto</Link>
      </PageHeader>

      <form className="mb-5 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Buscar por nombre…" className="input max-w-xs py-2.5" />
        <select name="estado" defaultValue={sp.estado ?? ""} className="input w-auto py-2.5">
          <option value="">Todos los estados</option>
          <option value="active">Publicados</option>
          <option value="draft">Borradores</option>
          <option value="archived">Archivados</option>
        </select>
        <button className="btn-outline py-2.5">Filtrar</button>
      </form>

      {products.length === 0 ? (
        <Empty>No hay productos. <Link href="/admin/productos/nuevo" className="underline">Crea el primero</Link>.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-espresso/10 bg-cream-50">
              <tr><th className={th}>Producto</th><th className={th}>Estado</th><th className={th}>Precio</th><th className={th}>Stock</th><th className={th}>Vendidos</th><th className={th}></th></tr>
            </thead>
            <tbody className="divide-y divide-espresso/10">
              {products.map((p) => {
                const img = [...(p.product_images ?? [])].sort((a, b) => a.position - b.position)[0];
                const stock = (p.product_variants ?? []).reduce((s, v) => s + v.stock, 0);
                const st = STATUS[p.status];
                return (
                  <tr key={p.id} className="hover:bg-cream-50">
                    <td className={td}>
                      <Link href={`/admin/productos/${p.id}`} className="flex items-center gap-3">
                        <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                          {img && <Image src={img.url} alt="" fill sizes="44px" className="object-cover" />}
                        </div>
                        <div>
                          <p className="font-medium text-espresso">{p.name}</p>
                          <p className="text-xs text-espresso-500">{p.categories?.name ?? "Sin categoría"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className={td}><span className={`rounded-full px-2.5 py-1 text-[11px] ${st.cls}`}>{st.label}</span></td>
                    <td className={td}>
                      {p.price_cents > 0 ? formatPrice(p.price_cents) : <span className="text-rose-700">Sin precio</span>}
                      {p.compare_at_cents && <span className="ml-2 text-xs text-espresso-300 line-through">{formatPrice(p.compare_at_cents)}</span>}
                    </td>
                    <td className={`${td} ${stock === 0 ? "text-rose-700" : ""}`}>{stock}</td>
                    <td className={td}>{p.sales_count}</td>
                    <td className={`${td} text-right`}><Link href={`/admin/productos/${p.id}`} className="underline">Editar</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
