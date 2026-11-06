"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

export type NewsletterState = { ok: boolean; message: string } | null;

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Introduce un email válido").max(200),
  consent: z.literal("on", { errorMap: () => ({ message: "Debes aceptar la política de privacidad" }) }),
});

export async function subscribeNewsletter(_: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Campo trampa anti-bots
  if (formData.get("company")) return { ok: true, message: "¡Gracias por suscribirte!" };

  const parsed = schema.safeParse({ email: formData.get("email"), consent: formData.get("consent") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const db = createAdminClient();
  const { error } = await db.from("newsletter_subscribers").upsert({ email: parsed.data.email }, { onConflict: "email", ignoreDuplicates: true });
  if (error) return { ok: false, message: "No hemos podido completar la suscripción. Inténtalo de nuevo." };
  return { ok: true, message: "¡Gracias! Te avisaremos de novedades y lanzamientos." };
}
