"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { createImageUploadUrl, saveProduct, type ActionState } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { centsToInput, slugify } from "@/lib/format";
import { FormMessage, SubmitButton } from "@/components/forms";
import type { Category, Product } from "@/lib/types";

interface VariantRow {
  key: string;
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: string;
  price: string;
}
interface ImageRow {
  url: string;
  storage_path: string | null;
  alt: string;
}

let k = 0;
const newKey = () => `v${++k}-${Date.now()}`;

/** Redimensiona y comprime en el navegador antes de subir (máx. 2000 px, JPEG 86%). */
async function optimize(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const [state, action] = useActionState<ActionState, FormData>(saveProduct, null);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.product_variants?.length
      ? product.product_variants.map((v) => ({
          key: newKey(),
          id: v.id,
          size: v.size ?? "",
          color: v.color ?? "",
          sku: v.sku ?? "",
          stock: String(v.stock),
          price: centsToInput(v.price_cents),
        }))
      : [{ key: newKey(), size: "Única", color: "", sku: "", stock: "0", price: "" }],
  );
  const [images, setImages] = useState<ImageRow[]>(
    (product?.product_images ?? []).map((i) => ({ url: i.url, storage_path: i.storage_path, alt: i.alt })),
  );
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(null);
    const supabase = createClient();
    const list = Array.from(files).slice(0, 12 - images.length);
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        if (file.size > 15 * 1024 * 1024) throw new Error(`«${file.name}» supera 15 MB`);
        const blob = await optimize(file);
        const type = blob.type || file.type;
        const { path, token, publicUrl } = await createImageUploadUrl(file.name, type);
        const { error } = await supabase.storage.from("product-images").uploadToSignedUrl(path, token, blob, { contentType: type });
        if (error) throw new Error(error.message);
        setImages((prev) => [...prev, { url: publicUrl, storage_path: path, alt: "" }]);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Error al subir la imagen");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function moveImage(i: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function updateVariant(key: string, field: keyof VariantRow, value: string) {
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, [field]: value } : v)));
  }

  const variantsJson = JSON.stringify(
    variants.map((v) => ({ id: v.id ?? null, size: v.size, color: v.color, sku: v.sku, stock: Number(v.stock || 0), price: v.price || null })),
  );

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="variants" value={variantsJson} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="space-y-6">
        <section className="card space-y-5 p-6">
          <div>
            <label className="label" htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              required
              maxLength={120}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="slug">URL</label>
            <div className="flex items-center gap-2 text-sm text-espresso-500">
              <span className="shrink-0">/producto/</span>
              <input id="slug" name="slug" value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="description">Descripción</label>
            <textarea id="description" name="description" rows={5} defaultValue={product?.description} maxLength={5000} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="details">Detalles (separa cada punto con «·»)</label>
            <textarea id="details" name="details" rows={2} defaultValue={product?.details} maxLength={2000} className="input" placeholder="100% algodón · Lavar a 30 °C · Hecho en España" />
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <p className="font-medium text-espresso">Fotografías</p>
            <span className="text-xs text-espresso-500">La primera es la portada · máx. 12</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((img, i) => (
              <div key={img.url} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-cream-200">
                <Image src={img.url} alt="" fill sizes="150px" className="object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-espresso px-1.5 py-0.5 text-[9px] uppercase text-white">Portada</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/60 p-1 text-xs text-white">
                  <button type="button" onClick={() => moveImage(i, -1)} className="px-1.5" aria-label="Mover a la izquierda">←</button>
                  <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="px-1.5" aria-label="Quitar imagen">✕</button>
                  <button type="button" onClick={() => moveImage(i, 1)} className="px-1.5" aria-label="Mover a la derecha">→</button>
                </div>
              </div>
            ))}
            {images.length < 12 && (
              <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-espresso/20 text-center text-xs text-espresso-500 hover:border-espresso/50">
                <span className="text-2xl">+</span>
                {uploading > 0 ? `Subiendo ${uploading}…` : "Añadir fotos"}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
              </label>
            )}
          </div>
          {uploadError && <p className="mt-3 text-sm text-rose-700">{uploadError}</p>}
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <p className="font-medium text-espresso">Variantes e inventario</p>
            <button
              type="button"
              onClick={() => setVariants((p) => [...p, { key: newKey(), size: "", color: p[0]?.color ?? "", sku: "", stock: "0", price: "" }])}
              className="text-sm underline"
            >
              + Añadir variante
            </button>
          </div>
          <p className="mt-1 text-xs text-espresso-500">Cada combinación de talla/color tiene su propio stock. Deja «Precio» vacío para usar el precio general.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-espresso-500">
                  <th className="pb-2 pr-2 font-medium">Talla</th>
                  <th className="pb-2 pr-2 font-medium">Color</th>
                  <th className="pb-2 pr-2 font-medium">SKU</th>
                  <th className="pb-2 pr-2 font-medium">Stock</th>
                  <th className="pb-2 pr-2 font-medium">Precio (€)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.key}>
                    <td className="py-1 pr-2"><input value={v.size} onChange={(e) => updateVariant(v.key, "size", e.target.value)} className="input py-2" placeholder="M" aria-label="Talla" /></td>
                    <td className="py-1 pr-2"><input value={v.color} onChange={(e) => updateVariant(v.key, "color", e.target.value)} className="input py-2" placeholder="Crudo" aria-label="Color" /></td>
                    <td className="py-1 pr-2"><input value={v.sku} onChange={(e) => updateVariant(v.key, "sku", e.target.value)} className="input py-2" aria-label="SKU" /></td>
                    <td className="py-1 pr-2"><input value={v.stock} onChange={(e) => updateVariant(v.key, "stock", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="input w-24 py-2" aria-label="Stock" /></td>
                    <td className="py-1 pr-2"><input value={v.price} onChange={(e) => updateVariant(v.key, "price", e.target.value)} inputMode="decimal" className="input w-28 py-2" placeholder="—" aria-label="Precio de la variante" /></td>
                    <td className="py-1">
                      <button type="button" disabled={variants.length === 1} onClick={() => setVariants((p) => p.filter((x) => x.key !== v.key))} className="px-2 text-rose-700 disabled:opacity-30" aria-label="Quitar variante">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="card space-y-5 p-6">
          <div>
            <label className="label" htmlFor="status">Estado</label>
            <select id="status" name="status" defaultValue={product?.status ?? "draft"} className="input">
              <option value="draft">Borrador (no visible)</option>
              <option value="active">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="price">Precio (€, IVA incl.)</label>
            <input id="price" name="price" inputMode="decimal" required defaultValue={centsToInput(product?.price_cents ?? 0)} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="compare_at">Precio anterior (para ofertas)</label>
            <input id="compare_at" name="compare_at" inputMode="decimal" defaultValue={centsToInput(product?.compare_at_cents)} className="input" placeholder="Vacío si no está rebajado" />
          </div>
          <div>
            <label className="label" htmlFor="category_id">Categoría</label>
            <select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""} className="input">
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={product?.featured} className="accent-espresso" /> Destacado en la portada</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_new" defaultChecked={product?.is_new} className="accent-espresso" /> Marcar como novedad</label>
        </section>

        <div className="space-y-3 xl:sticky xl:top-6">
          <FormMessage state={state} />
          <SubmitButton className="btn-primary w-full py-3.5">{product ? "Guardar cambios" : "Crear producto"}</SubmitButton>
          {uploading > 0 && <p className="text-center text-xs text-espresso-500">Espera a que terminen de subir las fotos antes de guardar.</p>}
        </div>
      </div>
    </form>
  );
}
