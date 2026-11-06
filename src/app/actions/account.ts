"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { ok: boolean; message: string } | null;

async function userOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      full_name: z.string().trim().min(2, "Introduce tu nombre").max(120),
      phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, "Teléfono no válido").optional(),
    })
    .safeParse({ full_name: formData.get("full_name"), phone: formData.get("phone") || undefined });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { supabase, user } = await userOrNull();
  if (!user) return { ok: false, message: "Sesión caducada" };
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name, phone: parsed.data.phone ?? null }).eq("id", user.id);
  if (error) return { ok: false, message: "No se han podido guardar los cambios" };
  revalidatePath("/cuenta");
  return { ok: true, message: "Datos actualizados" };
}

const addressSchema = z.object({
  full_name: z.string().trim().min(2, "Introduce el nombre del destinatario").max(120),
  line1: z.string().trim().min(3, "Introduce la dirección").max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, "Introduce la localidad").max(100),
  province: z.string().trim().min(2, "Introduce la provincia").max(100),
  postal_code: z.string().trim().regex(/^\d{5}$/, "Código postal no válido (5 dígitos)"),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, "Teléfono no válido").optional(),
  is_default: z.boolean(),
});

export async function saveAddress(_: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id");
  const parsed = addressSchema.safeParse({
    full_name: formData.get("full_name"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    city: formData.get("city"),
    province: formData.get("province"),
    postal_code: formData.get("postal_code"),
    phone: formData.get("phone") || undefined,
    is_default: formData.get("is_default") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { supabase, user } = await userOrNull();
  if (!user) return { ok: false, message: "Sesión caducada" };

  if (parsed.data.is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }
  const row = { ...parsed.data, line2: parsed.data.line2 ?? null, phone: parsed.data.phone ?? null, country: "ES", user_id: user.id };
  const { error } =
    typeof id === "string" && id
      ? await supabase.from("addresses").update(row).eq("id", id).eq("user_id", user.id)
      : await supabase.from("addresses").insert(row);
  if (error) return { ok: false, message: "No se ha podido guardar la dirección" };
  revalidatePath("/cuenta/direcciones");
  return { ok: true, message: "Dirección guardada" };
}

export async function deleteAddress(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase, user } = await userOrNull();
  if (!user || !id) return;
  await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/cuenta/direcciones");
}
