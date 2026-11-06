import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Asocia a la cuenta los pedidos hechos como invitado con el mismo email.
 * Solo se ejecuta si Supabase ha verificado el email del usuario.
 * (Vive fuera de los archivos "use server" para que no se pueda invocar desde el navegador.)
 */
export async function claimGuestOrders(user: User) {
  if (!user.email || !user.email_confirmed_at) return;
  const db = createAdminClient();
  await db.from("orders").update({ user_id: user.id }).is("user_id", null).ilike("email", user.email);
}
