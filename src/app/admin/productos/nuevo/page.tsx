import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { PageHeader } from "../../ui";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  await requireAdmin();
  const { data } = await createAdminClient().from("categories").select("*").order("position");
  return (
    <>
      <Link href="/admin/productos" className="text-sm text-espresso-500">← Productos</Link>
      <PageHeader title="Nuevo producto" />
      <ProductForm categories={(data ?? []) as Category[]} />
    </>
  );
}
