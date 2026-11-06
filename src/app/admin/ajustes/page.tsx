import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/pricing";
import { isPending, site } from "@/lib/config";
import type { Category } from "@/lib/types";
import { deleteCategory } from "../actions";
import { PageHeader } from "../ui";
import { CategoryForm, ShippingForm } from "./SettingsForms";

export const metadata = { title: "Ajustes" };

export default async function AdminSettings() {
  await requireAdmin();
  const [settings, { data }] = await Promise.all([getSettings(), createAdminClient().from("categories").select("*").order("position")]);
  const categories = (data ?? []) as Category[];
  const pendingLegal = [...Object.entries(site.owner), ...Object.entries(site.shipping)].filter(([, v]) => typeof v === "string" && isPending(v));

  return (
    <>
      <PageHeader title="Ajustes" />
      {pendingLegal.length > 0 && (
        <div className="mb-6 rounded-2xl bg-copper-100 p-5 text-sm text-copper-600">
          <p className="font-medium">Faltan datos del titular y de envíos ({pendingLegal.length})</p>
          <p className="mt-1">Rellénalos en <code className="rounded bg-white/60 px-1">src/lib/config.ts</code> antes de vender: aparecen en el aviso legal, privacidad y condiciones de compra.</p>
        </div>
      )}
      <div className="space-y-6">
        <ShippingForm settings={settings} />
        <div className="card space-y-5 p-6">
          <p className="font-medium text-espresso">Categorías</p>
          {categories.map((c) => (
            <div key={c.id} className="border-b border-espresso/10 pb-5">
              <CategoryForm category={c} />
              <form action={deleteCategory} className="mt-2">
                <input type="hidden" name="id" value={c.id} />
                <button className="text-xs text-rose-700 underline">Eliminar categoría (los productos quedan sin categoría)</button>
              </form>
            </div>
          ))}
          <div>
            <p className="mb-3 text-sm text-espresso-500">Nueva categoría</p>
            <CategoryForm />
          </div>
        </div>
      </div>
    </>
  );
}
