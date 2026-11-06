import { NextResponse } from "next/server";
import { cartInputSchema, quoteCart } from "@/lib/pricing";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = cartInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    const quote = await quoteCart(parsed.data);
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json({ error: "No se ha podido calcular el carrito" }, { status: 500 });
  }
}
