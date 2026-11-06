import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product, Review } from "@/lib/types";
import { isPreview } from "@/lib/config";
import { demoCategories, demoProducts } from "@/lib/demo";

const PRODUCT_FIELDS =
  "*, categories(id, slug, name), product_images(*), product_variants(*)";

function sortChildren(p: Product): Product {
  p.product_images?.sort((a, b) => a.position - b.position);
  p.product_variants?.sort((a, b) => a.position - b.position);
  return p;
}

export function totalStock(p: Product) {
  return (p.product_variants ?? []).reduce((s, v) => s + v.stock, 0);
}

export function isPurchasable(p: Product) {
  return p.status === "active" && p.price_cents > 0 && totalStock(p) > 0;
}

export async function getCategories(): Promise<Category[]> {
  if (isPreview()) return demoCategories;
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("position");
  return (data ?? []) as Category[];
}

export interface CatalogFilters {
  q?: string;
  category?: string;
  min?: number; // céntimos
  max?: number; // céntimos
  sort?: "popular" | "new" | "price-asc" | "price-desc" | "rating";
  inStock?: boolean;
  onSale?: boolean;
}

export async function getProducts(f: CatalogFilters = {}, limit = 60): Promise<Product[]> {
  if (isPreview()) {
    const q = f.q?.toLowerCase();
    const cat = demoCategories.find((c) => c.slug === f.category);
    if (f.category && !cat) return [];
    if (f.onSale) return [];
    return demoProducts
      .filter((p) => (!cat || p.category_id === cat.id) && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)))
      .slice(0, limit);
  }
  const supabase = await createClient();
  let query = supabase.from("products").select(PRODUCT_FIELDS).eq("status", "active");

  if (f.q) {
    const term = f.q.replace(/[%_,()]/g, " ").trim();
    if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  if (f.category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", f.category).maybeSingle();
    if (!cat) return [];
    query = query.eq("category_id", cat.id);
  }
  if (f.min != null) query = query.gte("price_cents", f.min);
  if (f.max != null) query = query.lte("price_cents", f.max);
  if (f.onSale) query = query.not("compare_at_cents", "is", null);

  switch (f.sort) {
    case "price-asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price_cents", { ascending: false });
      break;
    case "rating":
      query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
      break;
    case "new":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("sales_count", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data } = await query.limit(limit);
  let products = ((data ?? []) as Product[]).map(sortChildren);
  if (f.onSale) products = products.filter((p) => p.compare_at_cents != null && p.compare_at_cents > p.price_cents);
  if (f.inStock) products = products.filter((p) => totalStock(p) > 0);
  return products;
}

export async function getFeatured(limit = 8) {
  if (isPreview()) return demoProducts.slice(0, limit);
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("status", "active")
    .eq("featured", true)
    .order("sales_count", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Product[]).map(sortChildren);
}

export async function getNewArrivals(limit = 8) {
  if (isPreview()) return demoProducts.slice(0, limit);
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("status", "active")
    .eq("is_new", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Product[]).map(sortChildren);
}

export async function getOnSale(limit = 8) {
  const products = await getProducts({ onSale: true }, limit);
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isPreview()) return demoProducts.find((p) => p.slug === slug) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_FIELDS).eq("slug", slug).eq("status", "active").maybeSingle();
  return data ? sortChildren(data as Product) : null;
}

export async function getRelated(p: Product, limit = 4) {
  if (isPreview()) return demoProducts.filter((x) => x.id !== p.id).slice(0, limit);
  if (!p.category_id) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("status", "active")
    .eq("category_id", p.category_id)
    .neq("id", p.id)
    .limit(limit);
  return ((data ?? []) as Product[]).map(sortChildren);
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  if (isPreview()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Review[];
}

export async function getLatestReviews(limit = 6): Promise<Review[]> {
  if (isPreview()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, products(name, slug)")
    .eq("approved", true)
    .gte("rating", 4)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Review[];
}
