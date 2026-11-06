"use server";

import { revalidatePath } from "next/cache";
import { rows } from "@/lib/types";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { parseEurosToCents, slugify } from "@/lib/format";

// ⚠️ Cada función exportada aquí es un endpoint público: TODAS empiezan por requireAdmin().

export type ActionState = { ok: boolean; message: string; id?: string } | null;
const BUCKET = "product-images";

function revalidateStore() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Imágenes: subida directa del navegador a Supabase Storage con URL firmada
// (evita el límite de 4,5 MB por petición de Vercel)
// ---------------------------------------------------------------------------
export async function createImageUploadUrl(fileName: string, contentType: string) {
  await requireAdmin();
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowed.includes(contentType)) throw new Error("Formato no permitido (usa JPG, PNG, WebP o AVIF)");
  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const base = slugify(fileName.replace(/\.[^.]+$/, "")) || "imagen";
  const path = `products/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID().slice(0, 8)}-${base}.${ext}`;
  const db = createAdminClient();
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error("No se ha podido preparar la subida");
  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
  return { path, token: data.token, publicUrl: pub.publicUrl };
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------
const variantSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  size: z.string().trim().max(40).optional().nullable(),
  color: z.string().trim().max(40).optional().nullable(),
  sku: z.string().trim().max(60).optional().nullable(),
  stock: z.coerce.number().int().min(0).max(100000),
  price: z.string().optional().nullable(),
});
const imageSchema = z.object({
  url: z.string().min(1).max(1000),
  storage_path: z.string().max(500).nullable().optional(),
  alt: z.string().max(200).optional().default(""),
});

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(5000).default(""),
  details: z.string().trim().max(2000).default(""),
  category_id: z.string().uuid().nullable(),
  price: z.string(),
  compare_at: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]),
  featured: z.boolean(),
  is_new: z.boolean(),
  variants: z.array(variantSchema).min(1, "Añade al menos una variante (aunque sea talla única)"),
  images: z.array(imageSchema).max(12),
});

export async function saveProduct(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  let variants: unknown, images: unknown;
  try {
    variants = JSON.parse(String(formData.get("variants") ?? "[]"));
    images = JSON.parse(String(formData.get("images") ?? "[]"));
  } catch {
    return { ok: false, message: "Datos del formulario no válidos" };
  }
  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") ?? "",
    details: formData.get("details") ?? "",
    category_id: formData.get("category_id") || null,
    price: String(formData.get("price") ?? ""),
    compare_at: String(formData.get("compare_at") ?? ""),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
    is_new: formData.get("is_new") === "on",
    variants,
    images,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;

  const price = parseEurosToCents(d.price);
  if (price == null) return { ok: false, message: "Precio no válido" };
  const compareAt = d.compare_at ? parseEurosToCents(d.compare_at) : null;
  if (d.compare_at && compareAt == null) return { ok: false, message: "Precio anterior no válido" };
  if (compareAt != null && compareAt <= price) return { ok: false, message: "El precio anterior debe ser mayor que el actual para mostrarse como oferta" };
  if (d.status === "active" && price <= 0) return { ok: false, message: "Pon un precio mayor que 0 antes de publicar el producto" };

  const variantRows = [];
  for (const [i, v] of d.variants.entries()) {
    const vp = v.price ? parseEurosToCents(v.price) : null;
    if (v.price && vp == null) return { ok: false, message: `Precio no válido en la variante ${i + 1}` };
    variantRows.push({ id: v.id || undefined, size: v.size || null, color: v.color || null, sku: v.sku || null, stock: v.stock, price_cents: vp, position: i });
  }

  const db = createAdminClient();
  const slug = slugify(d.slug || d.name);
  if (!slug) return { ok: false, message: "No se ha podido generar la URL del producto" };

  const row = {
    name: d.name,
    slug,
    description: d.description,
    details: d.details,
    category_id: d.category_id,
    price_cents: price,
    compare_at_cents: compareAt,
    status: d.status,
    featured: d.featured,
    is_new: d.is_new,
  };

  let productId = d.id;
  if (productId) {
    const { error } = await db.from("products").update(row).eq("id", productId);
    if (error) return { ok: false, message: error.code === "23505" ? "Ya existe un producto con esa URL" : "Error al guardar el producto" };
  } else {
    const { data, error } = await db.from("products").insert(row).select("id").single();
    if (error || !data) return { ok: false, message: error?.code === "23505" ? "Ya existe un producto con esa URL" : "Error al crear el producto" };
    productId = data.id as string;
  }

  // Variantes: actualizar existentes, crear nuevas, borrar las quitadas
  const { data: existingVariants } = await db.from("product_variants").select("id").eq("product_id", productId);
  const keepIds = new Set(variantRows.filter((v) => v.id).map((v) => v.id));
  const toDelete = rows<{ id: string }>(existingVariants).map((v) => v.id).filter((id) => !keepIds.has(id));
  if (toDelete.length) await db.from("product_variants").delete().in("id", toDelete);
  for (const v of variantRows) {
    const { id, ...rest } = v;
    const res = id
      ? await db.from("product_variants").update(rest).eq("id", id).eq("product_id", productId)
      : await db.from("product_variants").insert({ ...rest, product_id: productId });
    if (res.error) return { ok: false, message: res.error.code === "23505" ? `El SKU «${v.sku}» ya existe en otro producto` : "Error al guardar las variantes", id: productId };
  }

  // Imágenes: reemplazar la lista y borrar del storage las que se han quitado
  const { data: oldImages } = await db.from("product_images").select("storage_path").eq("product_id", productId);
  const keepPaths = new Set(d.images.map((i) => i.storage_path).filter(Boolean));
  const removed = rows<{ storage_path: string | null }>(oldImages).map((i) => i.storage_path).filter((p): p is string => !!p && !keepPaths.has(p));
  await db.from("product_images").delete().eq("product_id", productId);
  if (d.images.length) {
    await db.from("product_images").insert(
      d.images.map((img, i) => ({ product_id: productId, url: img.url, storage_path: img.storage_path ?? null, alt: img.alt || d.name, position: i })),
    );
  }
  if (removed.length) await db.storage.from(BUCKET).remove(removed);

  revalidateStore();
  redirect(`/admin/productos/${productId}?${d.id ? "guardado" : "creado"}=1&t=${Date.now()}`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const db = createAdminClient();
  const { data: imgs } = await db.from("product_images").select("storage_path").eq("product_id", id);
  await db.from("products").delete().eq("id", id);
  const paths = rows<{ storage_path: string | null }>(imgs).map((i) => i.storage_path).filter((p): p is string => !!p);
  if (paths.length) await db.storage.from(BUCKET).remove(paths);
  revalidateStore();
  redirect("/admin/productos");
}

export async function updateStock(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const stock = z.coerce.number().int().min(0).max(100000).parse(formData.get("stock"));
  await createAdminClient().from("product_variants").update({ stock }).eq("id", id);
  revalidateStore();
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------
const orderUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]),
  note: z.string().trim().max(500).optional(),
  carrier: z.string().trim().max(60).optional(),
  tracking_number: z.string().trim().max(100).optional(),
  tracking_url: z.string().trim().url("URL de seguimiento no válida").max(500).optional().or(z.literal("")),
});

export async function updateOrder(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = orderUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
    carrier: formData.get("carrier") || undefined,
    tracking_number: formData.get("tracking_number") || undefined,
    tracking_url: formData.get("tracking_url") || "",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const db = createAdminClient();
  const { data: current } = await db.from("orders").select("status").eq("id", d.id).single();
  if (!current) return { ok: false, message: "Pedido no encontrado" };
  if (current.status === "pending" && d.status !== "pending" && d.status !== "cancelled") {
    return { ok: false, message: "Un pedido pendiente de pago solo se marca como pagado cuando Stripe lo confirma" };
  }

  const { error } = await db
    .from("orders")
    .update({ status: d.status, carrier: d.carrier ?? null, tracking_number: d.tracking_number ?? null, tracking_url: d.tracking_url || null })
    .eq("id", d.id);
  if (error) return { ok: false, message: "No se ha podido actualizar el pedido" };
  if (current.status !== d.status || d.note) {
    await db.from("order_status_history").insert({ order_id: d.id, status: d.status, note: d.note ?? null });
  }
  revalidatePath(`/admin/pedidos/${d.id}`);
  revalidatePath("/admin/pedidos");
  return { ok: true, message: "Pedido actualizado" };
}

// ---------------------------------------------------------------------------
// Cupones
// ---------------------------------------------------------------------------
export async function createCoupon(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Código: 3-30 caracteres, letras, números, - o _"),
      type: z.enum(["percent", "fixed"]),
      value: z.string().min(1, "Indica el valor"),
      min_order: z.string().optional(),
      max_uses: z.string().optional(),
      starts_at: z.string().optional(),
      expires_at: z.string().optional(),
    })
    .safeParse(Object.fromEntries(["code", "type", "value", "min_order", "max_uses", "starts_at", "expires_at"].map((k) => [k, formData.get(k) || undefined])));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;

  let value: number | null;
  if (d.type === "percent") {
    const n = Number(d.value.replace(",", "."));
    value = Number.isInteger(n) && n >= 1 && n <= 100 ? n : null;
    if (value == null) return { ok: false, message: "El porcentaje debe ser un número entero entre 1 y 100" };
  } else {
    value = parseEurosToCents(d.value);
    if (!value) return { ok: false, message: "Importe de descuento no válido" };
  }
  const minOrder = d.min_order ? parseEurosToCents(d.min_order) : 0;
  if (minOrder == null) return { ok: false, message: "Pedido mínimo no válido" };
  const maxUses = d.max_uses ? Number(d.max_uses) : null;
  if (maxUses != null && (!Number.isInteger(maxUses) || maxUses < 1)) return { ok: false, message: "Usos máximos no válidos" };

  const { error } = await createAdminClient().from("coupons").insert({
    code: d.code,
    type: d.type,
    value,
    min_order_cents: minOrder,
    max_uses: maxUses,
    starts_at: d.starts_at ? new Date(d.starts_at).toISOString() : null,
    expires_at: d.expires_at ? new Date(`${d.expires_at}T23:59:59`).toISOString() : null,
  });
  if (error) return { ok: false, message: error.code === "23505" ? "Ese código ya existe" : "No se ha podido crear el cupón" };
  revalidatePath("/admin/cupones");
  return { ok: true, message: `Cupón ${d.code} creado` };
}

export async function toggleCoupon(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const active = formData.get("active") === "true";
  await createAdminClient().from("coupons").update({ active: !active }).eq("id", id);
  revalidatePath("/admin/cupones");
}

export async function deleteCoupon(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await createAdminClient().from("coupons").delete().eq("id", id);
  revalidatePath("/admin/cupones");
}

// ---------------------------------------------------------------------------
// Valoraciones
// ---------------------------------------------------------------------------
export async function moderateReview(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const action = z.enum(["approve", "hide", "delete"]).parse(formData.get("action"));
  const db = createAdminClient();
  if (action === "delete") await db.from("reviews").delete().eq("id", id);
  else await db.from("reviews").update({ approved: action === "approve" }).eq("id", id);
  revalidatePath("/admin/valoraciones");
  revalidateStore();
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------
export async function deleteSubscriber(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await createAdminClient().from("newsletter_subscribers").delete().eq("id", id);
  revalidatePath("/admin/newsletter");
}

// ---------------------------------------------------------------------------
// Ajustes y categorías
// ---------------------------------------------------------------------------
export async function saveSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const shipping = parseEurosToCents(String(formData.get("shipping") ?? "0") || "0");
  const freeRaw = String(formData.get("free_threshold") ?? "").trim();
  const free = freeRaw ? parseEurosToCents(freeRaw) : null;
  if (shipping == null) return { ok: false, message: "Coste de envío no válido" };
  if (freeRaw && free == null) return { ok: false, message: "Importe para envío gratis no válido" };
  const { error } = await createAdminClient().from("settings").update({ shipping_cents: shipping, free_shipping_threshold_cents: free, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) return { ok: false, message: "No se han podido guardar los ajustes" };
  revalidateStore();
  return { ok: true, message: "Ajustes guardados" };
}

export async function saveCategory(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: z.string().uuid().optional(),
      name: z.string().trim().min(2, "Nombre obligatorio").max(60),
      description: z.string().trim().max(200).optional(),
      position: z.coerce.number().int().min(0).max(999).default(0),
    })
    .safeParse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      position: formData.get("position") || 0,
    });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const db = createAdminClient();
  const row = { name: d.name, description: d.description ?? null, position: d.position };
  const { error } = d.id
    ? await db.from("categories").update(row).eq("id", d.id)
    : await db.from("categories").insert({ ...row, slug: slugify(d.name) });
  if (error) return { ok: false, message: error.code === "23505" ? "Ya existe una categoría con ese nombre" : "No se ha podido guardar la categoría" };
  revalidateStore();
  return { ok: true, message: "Categoría guardada" };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await createAdminClient().from("categories").delete().eq("id", id);
  revalidateStore();
}
