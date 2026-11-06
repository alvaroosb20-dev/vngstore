import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPreview } from "@/lib/config";

export async function getCurrentUser() {
  if (isPreview()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  if (isPreview()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("id, email, full_name, phone, role").eq("id", user.id).single();
  return data as { id: string; email: string | null; full_name: string | null; phone: string | null; role: "customer" | "admin" } | null;
}

export async function requireUser(next = "/cuenta") {
  const user = await getCurrentUser();
  if (!user) redirect(`/cuenta/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Usar al principio de CADA server action y página de administración. */
export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/cuenta/login?next=/admin");
  if (profile.role !== "admin") redirect("/");
  return profile;
}
