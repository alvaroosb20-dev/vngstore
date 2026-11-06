import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { Stars } from "./Stars";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const images = product.product_images ?? [];
  const [first, second] = images;
  const stock = (product.product_variants ?? []).reduce((s, v) => s + v.stock, 0);
  const onSale = product.compare_at_cents != null && product.compare_at_cents > product.price_cents;
  const pct = onSale ? Math.round((1 - product.price_cents / product.compare_at_cents!) * 100) : 0;

  return (
    <Link href={`/producto/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-200">
        {first ? (
          <>
            <Image
              src={first.url}
              alt={first.alt || product.name}
              fill
              priority={priority}
              sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
              className={`object-cover transition duration-700 ease-out group-hover:scale-[1.04] ${second ? "group-hover:opacity-0" : ""}`}
            />
            {second && (
              <Image
                src={second.url}
                alt={second.alt || product.name}
                fill
                sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                className="object-cover opacity-0 transition duration-700 ease-out group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-3xl text-espresso-300">VNG</div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {onSale && <span className="rounded-full bg-copper px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">-{pct}%</span>}
          {product.is_new && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-espresso">Nuevo</span>}
          {stock === 0 && product.price_cents > 0 && <span className="rounded-full bg-espresso/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">Agotado</span>}
        </div>
      </div>
      <div className="mt-4 space-y-1 px-0.5">
        <h3 className="text-[15px] text-espresso">{product.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className={`text-[15px] ${onSale ? "text-copper-600" : "text-espresso"}`}>
            {product.price_cents > 0 ? formatPrice(product.price_cents) : <span className="text-espresso-500">Próximamente</span>}
          </span>
          {onSale && <span className="text-xs text-espresso-300 line-through">{formatPrice(product.compare_at_cents!)}</span>}
        </div>
        {product.rating_count > 0 && <Stars value={Number(product.rating_avg)} count={product.rating_count} />}
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
