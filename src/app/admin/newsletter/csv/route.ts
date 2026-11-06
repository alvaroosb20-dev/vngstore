import { NextResponse } from "next/server";
import { rows } from "@/lib/types";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const profile = await getProfile();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { data } = await createAdminClient().from("newsletter_subscribers").select("email, created_at").order("created_at");
  const csv = ["email,fecha", ...rows<{ email: string; created_at: string }>(data).map((s) => `${String(s.email).replace(/[",\n]/g, "")},${s.created_at}`)].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-vng-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
