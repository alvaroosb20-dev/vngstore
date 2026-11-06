import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/product/Gallery";
import { AddToCart } from "@/components/product/AddToCart";
import { Stars } from "@/components/product/Stars";
import { ReviewForm } from "@/components/product/ReviewForm";
import { ProductGrid } from "@/components/product/ProductCard";
import { ReturnIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { getProductBySlug, getProductReviews, getRelated, totalStock } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { isPreview, site } from "@/lib/config";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Producto no encontrado" };
  const img = p.product_images?.[0]?.url;
  return {
    title: p.name,
    description: p.description.slice(0, 160),
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: { title: p.name, description: p.description.slice(0, 160), images: img ? [img] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, related] = await Promise.all([getProductReviews(product.id), getRelated(product)]);

  // ¿Puede el usuario valorar? (ha comprado y aún no ha valorado)
  let canReview = false;
  const supabase = isPreview() ? null : await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (supabase && user) {
    const [{ data: bought }, { data: existing }] = await Promise.all([
      supabase
        .from("order_items")
        .select("id, orders!inner(user_id, status)")
        .eq("product_id", product.id)
        .eq("orders.user_id", user.id)
        .in("orders.status", ["paid", "processing", "shipped", "delivered"])
        .limit(1),
      supabase.from("reviews").select("id").eq("product_id", product.id).eq("user_id", user.id).maybeSingle(),
    ]);
    canReview = (bought?.length ?? 0) > 0 && !existing;
  }

  const stock = totalStock(product);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: (product.product_images ?? []).map((i) => (i.url.startsWith("http") ? i.url : `${site.url}${i.url}`)),
    sku: product.product_variants?.[0]?.sku ?? undefined,
    brand: { "@type": "Brand", name: "VNG" },
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (product.price_cents / 100).toFixed(2),
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${site.url}/producto/${product.slug}`,
    },
    ...(product.rating_count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(product.rating_avg), reviewCount: product.rating_count } }
      : {}),
  };

  return (
    <div className="container-x pt-8 md:pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav className="mb-6 text-xs text-espresso-500" aria-label="Ruta">
        <Link href="/tienda" className="hover:text-espresso">Tienda</Link>
        {product.categories && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/tienda?categoria=${product.categories.slug}`} className="hover:text-espresso">
              {product.categories.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-espresso">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <Gallery images={product.product_images ?? []} name={product.name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          {product.is_new && <p className="eyebrow mb-3">Novedad</p>}
          <h1 className="h-display text-4xl md:text-5xl">{product.name}</h1>
          {product.rating_count > 0 && (
            <a href="#valoraciones" className="mt-3 inline-block">
              <Stars value={Number(product.rating_avg)} count={product.rating_count} />
            </a>
          )}
          <p className="mt-6 text-[15px] leading-relaxed text-espresso-700">{product.description}</p>

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <div className="mt-10 divide-y divide-espresso/10 border-y border-espresso/10">
            {product.details && (
              <details className="group py-5" open>
                <summary className="flex cursor-pointer list-none justify-between text-sm font-medium text-espresso">
                  Detalles <span className="transition group-open:rotate-45">+</span>
                </summary>
                <ul className="mt-3 space-y-1.5 text-sm text-espresso-700">
                  {product.details.split("·").map((d) => d.trim()).filter(Boolean).map((d) => (
                    <li key={d}>— {d}</li>
                  ))}
                </ul>
              </details>
            )}
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none justify-between text-sm font-medium text-espresso">
                Envíos y devoluciones <span className="transition group-open:rotate-45">+</span>
              </summary>
              <div className="mt-3 space-y-2 text-sm text-espresso-700">
                <p>Enviamos a toda España. Consulta plazos y costes en <Link href="/envios" className="underline">información de envíos</Link>.</p>
                <p>Tienes {site.returnDays} días desde la recepción para devolverlo. <Link href="/devoluciones" className="underline">Ver política</Link>.</p>
              </div>
            </details>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-[11px] text-espresso-500">
            <div className="flex flex-col items-center gap-1.5"><TruckIcon /> Envío a toda España</div>
            <div className="flex flex-col items-center gap-1.5"><ReturnIcon /> {site.returnDays} días de devolución</div>
            <div className="flex flex-col items-center gap-1.5"><ShieldIcon /> Pago seguro</div>
          </div>
        </div>
      </div>

      <section id="valoraciones" className="mt-24 scroll-mt-28">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Valoraciones</p>
            <h2 className="h-display mt-3 text-3xl md:text-4xl">Opiniones de clientes</h2>
          </div>
          {product.rating_count > 0 && (
            <div className="flex items-center gap-3">
              <span className="font-serif text-4xl text-espresso">{Number(product.rating_avg).toFixed(1)}</span>
              <Stars value={Number(product.rating_avg)} count={product.rating_count} size="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {reviews.length === 0 && <p className="text-sm text-espresso-500">Este producto aún no tiene valoraciones.</p>}
            {reviews.map((r) => (
              <article key={r.id} className="card p-6">
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} />
                  <time className="text-xs text-espresso-300">{formatDate(r.created_at)}</time>
                </div>
                {r.title && <p className="mt-3 font-medium text-espresso">{r.title}</p>}
                <p className="mt-2 text-sm leading-relaxed text-espresso-700">{r.body}</p>
                <p className="mt-4 text-xs text-espresso-500">{r.author_name} · Compra verificada</p>
              </article>
            ))}
          </div>
          <div>
            {canReview ? (
              <ReviewForm productId={product.id} />
            ) : (
              <p className="card p-6 text-sm text-espresso-500">Solo los clientes que han comprado este producto pueden dejar una valoración.</p>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="h-display mb-10 text-3xl md:text-4xl">También te puede gustar</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
