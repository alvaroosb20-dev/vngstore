import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";
import { deleteProduct } from "../../actions";
import { PageHeader } from "../../ui";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Editar producto" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ creado?: string; guardado?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createAdminClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    db.from("products").select("*, product_images(*), product_variants(*)").eq("id", id).maybeSingle(),
    db.from("categories").select("*").order("position"),
  ]);
  if (!product) notFound();
  const p = product as Product;
  p.product_images?.sort((a, b) => a.position - b.position);
  p.product_variants?.sort((a, b) => a.position - b.position);

  return (
    <>
      <Link href="/admin/productos" className="text-sm text-espresso-500">← Productos</Link>
      <PageHeader title={p.name}>
        {p.status === "active" && <Link href={`/producto/${p.slug}`} target="_blank" className="btn-outline py-2.5">Ver en la tienda ↗</Link>}
      </PageHeader>
      {(sp.creado === "1" || sp.guardado === "1") && (
        <p className="mb-6 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{sp.creado === "1" ? "Producto creado." : "Cambios guardados."}</p>
      )}
      <ProductForm key={p.updated_at} product={p} categories={(categories ?? []) as Category[]} />

      <details className="mt-12 max-w-xl">
        <summary className="cursor-pointer text-sm text-rose-700">Eliminar producto</summary>
        <div className="card mt-3 p-5 text-sm">
          <p className="text-espresso-700">Se borrará el producto, sus variantes y fotos. Los pedidos ya realizados conservan sus datos. Si solo quieres ocultarlo, márcalo como «Archivado».</p>
          <form action={deleteProduct} className="mt-4">
            <input type="hidden" name="id" value={p.id} />
            <button className="btn-danger py-2.5">Eliminar definitivamente</button>
          </form>
        </div>
      </details>
    </>
  );
}
