"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { ok: boolean; message: string } | null;

const schema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres)").max(2000),
});

export async function submitReview(_: ReviewState, formData: FormData): Promise<ReviewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Inicia sesión para valorar este producto." };

  const parsed = schema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title") || undefined,
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const author = (profile?.full_name || user.email?.split("@")[0] || "Cliente").split(" ")[0];

  // La política RLS solo permite insertar si el usuario ha comprado y pagado el producto.
  const { error } = await supabase.from("reviews").insert({
    product_id: parsed.data.productId,
    user_id: user.id,
    author_name: author,
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    body: parsed.data.body,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, message: "Ya has valorado este producto." };
    return { ok: false, message: "Solo los clientes que han comprado este producto pueden valorarlo." };
  }
  return { ok: true, message: "¡Gracias! Tu valoración se publicará tras una breve revisión." };
}
