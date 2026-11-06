import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductCard";
import { getCategories, getProducts, type CatalogFilters } from "@/lib/catalog";
import { parseEurosToCents } from "@/lib/format";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  return {
    title: q ? `Resultados para «${q}»` : "Tienda",
    description: "Todos los productos de VNG Store: camisetas, tote bags y joyería.",
    alternates: { canonical: "/tienda" },
  };
}

const SORTS: { value: NonNullable<CatalogFilters["sort"]>; label: string }[] = [
  { value: "popular", label: "Más vendidos" },
  { value: "new", label: "Novedades" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
  { value: "rating", label: "Mejor valorados" },
];

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const filters: CatalogFilters = {
    q: str("q")?.slice(0, 80),
    category: str("categoria"),
    min: parseEurosToCents(str("min")) ?? undefined,
    max: parseEurosToCents(str("max")) ?? undefined,
    sort: SORTS.some((s) => s.value === str("orden")) ? (str("orden") as CatalogFilters["sort"]) : "popular",
    inStock: str("disponibles") === "1",
    onSale: str("ofertas") === "1",
  };

  const [categories, products] = await Promise.all([getCategories(), getProducts(filters)]);
  const current = categories.find((c) => c.slug === filters.category);
  const title = filters.q ? `«${filters.q}»` : filters.onSale ? "Ofertas" : current?.name ?? "Toda la colección";
  const activeFilters = !!(filters.q || filters.category || filters.min || filters.max || filters.inStock || filters.onSale);

  const FilterForm = (
    <form action="/tienda" method="get" className="space-y-8">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      <fieldset>
        <legend className="label">Categoría</legend>
        <div className="mt-2 space-y-2 text-sm">
          <label className="flex items-center gap-2.5">
            <input type="radio" name="categoria" value="" defaultChecked={!filters.category} className="accent-espresso" /> Todas
          </label>
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2.5">
              <input type="radio" name="categoria" value={c.slug} defaultChecked={filters.category === c.slug} className="accent-espresso" /> {c.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Precio (€)</legend>
        <div className="mt-2 flex items-center gap-2">
          <input name="min" inputMode="decimal" placeholder="Mín" defaultValue={str("min")} className="input py-2" aria-label="Precio mínimo" />
          <span className="text-espresso-300">–</span>
          <input name="max" inputMode="decimal" placeholder="Máx" defaultValue={str("max")} className="input py-2" aria-label="Precio máximo" />
        </div>
      </fieldset>
      <fieldset className="space-y-2 text-sm">
        <legend className="label">Disponibilidad</legend>
        <label className="mt-2 flex items-center gap-2.5">
          <input type="checkbox" name="disponibles" value="1" defaultChecked={filters.inStock} className="accent-espresso" /> Solo en stock
        </label>
        <label className="flex items-center gap-2.5">
          <input type="checkbox" name="ofertas" value="1" defaultChecked={filters.onSale} className="accent-espresso" /> Solo ofertas
        </label>
      </fieldset>
      <fieldset>
        <legend className="label">Ordenar por</legend>
        <select name="orden" defaultValue={filters.sort} className="input mt-2 py-2.5">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </fieldset>
      <div className="flex gap-2">
        <button className="btn-primary flex-1">Aplicar</button>
        {activeFilters && (
          <Link href="/tienda" className="btn-outline">
            Limpiar
          </Link>
        )}
      </div>
    </form>
  );

  return (
    <div className="container-x pt-10 md:pt-14">
      <div className="mb-10 flex flex-col gap-2">
        <p className="eyebrow">{filters.q ? "Búsqueda" : "Tienda"}</p>
        <h1 className="h-display text-4xl md:text-6xl">{title}</h1>
        <p className="text-sm text-espresso-500">
          {products.length} {products.length === 1 ? "producto" : "productos"}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside>
          <details className="card p-5 lg:hidden">
            <summary className="cursor-pointer list-none text-sm font-medium text-espresso">Filtrar y ordenar</summary>
            <div className="mt-6">{FilterForm}</div>
          </details>
          <div className="sticky top-28 hidden lg:block">{FilterForm}</div>
        </aside>

        <div>
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="card flex flex-col items-center gap-4 px-6 py-20 text-center">
              <p className="font-serif text-3xl text-espresso">No hay productos que coincidan</p>
              <p className="text-sm text-espresso-500">Prueba con otros filtros o revisa toda la colección.</p>
              <Link href="/tienda" className="btn-outline mt-2">
                Ver todo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
