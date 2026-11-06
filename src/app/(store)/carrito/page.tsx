import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Cesta", robots: { index: false } };

export default async function CartPage({ searchParams }: { searchParams: Promise<{ cancelado?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="container-x pt-10 md:pt-14">
      <h1 className="h-display mb-10 text-4xl md:text-6xl">Tu cesta</h1>
      <CartView cancelled={sp.cancelado === "1"} />
    </div>
  );
}
