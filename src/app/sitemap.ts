import type { MetadataRoute } from "next";
import { rows } from "@/lib/types";
import { createClient } from "@supabase/supabase-js";
import { site } from "@/lib/config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ["", "/tienda", "/envios", "/devoluciones", "/contacto", "/aviso-legal", "/privacidad", "/cookies", "/condiciones"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : p === "/tienda" ? 0.9 : 0.3,
  }));

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return staticPages;

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const [{ data: products }, { data: categories }] = await Promise.all([
    db.from("products").select("slug, updated_at").eq("status", "active"),
    db.from("categories").select("slug"),
  ]);

  return [
    ...staticPages,
    ...rows<{ slug: string }>(categories).map((c) => ({ url: `${site.url}/tienda?categoria=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...rows<{ slug: string; updated_at: string }>(products).map((p) => ({ url: `${site.url}/producto/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
