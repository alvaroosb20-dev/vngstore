import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductCard";
import { Stars } from "@/components/product/Stars";
import { Reveal } from "@/components/Reveal";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ArrowRight, ReturnIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { getCategories, getFeatured, getLatestReviews, getNewArrivals, getOnSale, getProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/config";

export const revalidate = 0;

// Imagen por defecto para cada categoría creada inicialmente
const CATEGORY_FALLBACK: Record<string, string> = {
  camisetas: "/products/camiseta-angel-doblada.jpg",
  bolsos: "/products/tote-angel.jpg",
  joyeria: "/products/colgante-trebol.jpg",
};

export default async function HomePage() {
  const [categories, featured, newest, sale, reviews, settings, any] = await Promise.all([
    getCategories(),
    getFeatured(8),
    getNewArrivals(8),
    getOnSale(8),
    getLatestReviews(6),
    getSettings(),
    getProducts({}, 1),
  ]);
  const hasCatalog = any.length > 0;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 pb-16 pt-8 md:grid-cols-2 md:gap-16 md:pb-24 md:pt-12">
          <div className="order-2 md:order-1">
            <p className="eyebrow animate-fade-up">Colección Ángel</p>
            <h1 className="h-display mt-5 text-5xl leading-[1.02] animate-fade-up [animation-delay:120ms] sm:text-6xl lg:text-7xl">
              Un solo trazo.
              <br />
              <em className="font-normal text-copper-600">Para siempre.</em>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-espresso-500 animate-fade-up [animation-delay:240ms]">
              Camisetas, tote bags y joyería de líneas puras. Diseños minimalistas pensados para acompañarte cada día.
            </p>
            <div className="mt-9 flex flex-wrap gap-3 animate-fade-up [animation-delay:360ms]">
              <Link href="/tienda" className="btn-primary">
                Descubrir la colección <ArrowRight />
              </Link>
              <Link href="/tienda?orden=new" className="btn-outline">
                Novedades
              </Link>
            </div>
          </div>
          <div className="relative order-1 md:order-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-cream-200 animate-fade-in">
              <Image src="/products/tote-angel.jpg" alt="Tote bag VNG con ilustración de ángel a una línea" fill priority sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-4 hidden w-40 overflow-hidden rounded-2xl border-4 border-cream-50 shadow-xl sm:block lg:w-48">
              <div className="relative aspect-[4/5]">
                <Image src="/products/colgante-trebol.jpg" alt="Colgante trébol VNG" fill sizes="200px" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ventajas */}
      <section className="border-y border-espresso/10 bg-cream-100">
        <div className="container-x grid gap-6 py-7 text-sm text-espresso-700 sm:grid-cols-3">
          <div className="flex items-center justify-center gap-3">
            <TruckIcon />
            <span>
              {settings.free_shipping_threshold_cents != null
                ? `Envío gratis desde ${formatPrice(settings.free_shipping_threshold_cents)}`
                : "Envíos a toda España"}
            </span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <ReturnIcon />
            <span>{site.returnDays} días para devoluciones</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <ShieldIcon />
            <span>Pago seguro con Stripe</span>
          </div>
        </div>
      </section>

      {/* Categorías */}
      {categories.length > 0 && (
        <section className="container-x pt-20 md:pt-28">
          <Reveal className="mb-10 flex items-end justify-between">
            <div>
              <p className="eyebrow">Categorías</p>
              <h2 className="h-display mt-3 text-4xl md:text-5xl">Explora</h2>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            {categories.map((c, i) => {
              const img = c.image_url || CATEGORY_FALLBACK[c.slug];
              return (
                <Reveal key={c.id} delay={i * 100}>
                  <Link href={`/tienda?categoria=${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-cream-200">
                    {img && <Image src={img} alt={c.name} fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/0 to-ink/0" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-cream-50">
                      <div>
                        <h3 className="font-serif text-3xl">{c.name}</h3>
                        {c.description && <p className="mt-1 text-sm text-cream-100/90">{c.description}</p>}
                      </div>
                      <span className="rounded-full bg-cream-50/20 p-2.5 backdrop-blur transition group-hover:bg-cream-50 group-hover:text-espresso">
                        <ArrowRight />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {!hasCatalog && (
        <section className="container-x pt-20 text-center">
          <p className="eyebrow">Muy pronto</p>
          <h2 className="h-display mt-3 text-4xl">La colección está en camino</h2>
          <p className="mx-auto mt-4 max-w-md text-espresso-500">Suscríbete abajo y te avisamos el día del lanzamiento.</p>
        </section>
      )}

      <ProductSection eyebrow="Selección" title="Destacados" href="/tienda" products={featured} />
      <ProductSection eyebrow="Recién llegados" title="Novedades" href="/tienda?orden=new" products={newest} />
      <ProductSection eyebrow="Por tiempo limitado" title="Ofertas" href="/tienda?ofertas=1" products={sale} />

      {/* Opiniones reales (solo compradores verificados, aprobadas en el panel) */}
      {reviews.length > 0 && (
        <section className="mt-24 bg-cream-100 py-20 md:mt-32 md:py-28">
          <div className="container-x">
            <Reveal className="mb-12 text-center">
              <p className="eyebrow">Opiniones</p>
              <h2 className="h-display mt-3 text-4xl md:text-5xl">Lo que dicen nuestros clientes</h2>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {reviews.map((r, i) => (
                <Reveal key={r.id} delay={i * 80} className="card flex flex-col p-7">
                  <Stars value={r.rating} />
                  {r.title && <p className="mt-4 font-serif text-xl text-espresso">{r.title}</p>}
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-espresso-700">“{r.body}”</p>
                  <div className="mt-6 flex items-center justify-between text-xs text-espresso-500">
                    <span>{r.author_name} · Compra verificada</span>
                    {r.products && (
                      <Link href={`/producto/${r.products.slug}`} className="underline underline-offset-2">
                        {r.products.name}
                      </Link>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="container-x mt-24 md:mt-32">
        <Reveal className="rounded-[28px] border border-espresso/10 bg-white px-6 py-16 text-center md:py-20">
          <p className="eyebrow">Newsletter</p>
          <h2 className="h-display mx-auto mt-3 max-w-xl text-4xl md:text-5xl">Sé el primero en saberlo</h2>
          <p className="mx-auto mb-8 mt-4 max-w-md text-[15px] text-espresso-500">Lanzamientos, reposiciones y ofertas exclusivas. Sin spam.</p>
          <NewsletterForm />
        </Reveal>
      </section>
    </>
  );
}

function ProductSection({ eyebrow, title, href, products }: { eyebrow: string; title: string; href: string; products: Awaited<ReturnType<typeof getFeatured>> }) {
  if (products.length === 0) return null;
  return (
    <section className="container-x pt-20 md:pt-28">
      <Reveal className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="h-display mt-3 text-4xl md:text-5xl">{title}</h2>
        </div>
        <Link href={href} className="link-underline shrink-0 text-sm text-espresso">
          Ver todo
        </Link>
      </Reveal>
      <ProductGrid products={products} />
    </section>
  );
}
