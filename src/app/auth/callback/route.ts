import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimGuestOrders } from "@/lib/orders";

/** Destino de los enlaces de email de Supabase (confirmar cuenta y recuperar contraseña). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/cuenta";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/cuenta";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) await claimGuestOrders(data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/cuenta/login?error=enlace`);
}
