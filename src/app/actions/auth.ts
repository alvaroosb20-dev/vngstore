"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { claimGuestOrders } from "@/lib/orders";
import { site } from "@/lib/config";

export type FormState = { ok: boolean; message: string } | null;

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/cuenta";
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : site.url;
}

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72)
  .regex(/[A-Za-z]/, "La contraseña debe incluir letras")
  .regex(/[0-9]/, "La contraseña debe incluir algún número");

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email: z.string().trim().email("Email no válido"), password: z.string().min(1, "Introduce tu contraseña") })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return { ok: false, message: "Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada." };
    return { ok: false, message: "Email o contraseña incorrectos" };
  }
  if (data.user) await claimGuestOrders(data.user);
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2, "Introduce tu nombre").max(120),
      email: z.string().trim().toLowerCase().email("Email no válido"),
      password: passwordSchema,
      terms: z.literal("on", { errorMap: () => ({ message: "Debes aceptar la política de privacidad" }) }),
    })
    .safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      terms: formData.get("terms"),
    });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${await origin()}/auth/callback?next=/cuenta`,
    },
  });
  if (error) {
    if (error.code === "user_already_exists") return { ok: false, message: "Ya existe una cuenta con ese email" };
    if (error.code === "weak_password") return { ok: false, message: "La contraseña es demasiado débil" };
    return { ok: false, message: "No se ha podido crear la cuenta. Inténtalo de nuevo." };
  }
  // Si la confirmación de email está desactivada en Supabase, ya hay sesión
  if (data.session) {
    if (data.user) await claimGuestOrders(data.user);
    redirect("/cuenta");
  }
  return { ok: true, message: "Te hemos enviado un email para confirmar tu cuenta. Ábrelo para activarla." };
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.string().trim().email().safeParse(formData.get("email"));
  if (!email.success) return { ok: false, message: "Email no válido" };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${await origin()}/auth/callback?next=/cuenta/nueva-contrasena`,
  });
  // Misma respuesta exista o no la cuenta (evita enumeración de usuarios)
  return { ok: true, message: "Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { ok: false, message: password.error.issues[0].message };
  if (formData.get("password") !== formData.get("confirm")) return { ok: false, message: "Las contraseñas no coinciden" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "El enlace ha caducado. Solicita uno nuevo." };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { ok: false, message: "No se ha podido actualizar la contraseña" };
  redirect("/cuenta?password=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
