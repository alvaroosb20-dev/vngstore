import type { Category, Product } from "@/lib/types";

/** Catálogo de ejemplo SOLO para el modo vista previa (sin base de datos). Sin precios inventados. */
const now = "2026-11-06T00:00:00.000Z";

export const demoCategories: Category[] = [
  { id: "00000000-0000-4000-8000-000000000001", slug: "camisetas", name: "Camisetas", description: "Algodón y trazo fino.", image_url: null, position: 1 },
  { id: "00000000-0000-4000-8000-000000000002", slug: "bolsos", name: "Bolsos", description: "Tote bags para el día a día.", image_url: null, position: 2 },
  { id: "00000000-0000-4000-8000-000000000003", slug: "joyeria", name: "Joyería", description: "Piezas delicadas para llevar siempre.", image_url: null, position: 3 },
];

function product(
  n: number,
  slug: string,
  name: string,
  description: string,
  details: string,
  cat: number,
  images: [string, string][],
  variants: [string, string][],
): Product {
  const id = `00000000-0000-4000-8000-00000000010${n}`;
  const c = demoCategories[cat];
  return {
    id,
    slug,
    name,
    description,
    details,
    category_id: c.id,
    price_cents: 0,
    compare_at_cents: null,
    status: "active",
    featured: true,
    is_new: true,
    sales_count: 0,
    rating_avg: 0,
    rating_count: 0,
    created_at: now,
    updated_at: now,
    categories: { id: c.id, slug: c.slug, name: c.name },
    product_images: images.map(([url, alt], i) => ({ id: `${id}-img${i}`, product_id: id, url, alt, storage_path: null, position: i })),
    product_variants: variants.map(([size, color], i) => ({
      id: `${id}-v${i}`,
      product_id: id,
      size,
      color,
      sku: null,
      stock: 0,
      price_cents: null,
      position: i,
    })),
  };
}

export const demoProducts: Product[] = [
  product(
    1,
    "camiseta-angel",
    "Camiseta Ángel",
    "Camiseta color crudo con la ilustración del ángel en un solo trazo. Logotipo VNG bordado en la manga.",
    "Ilustración frontal a una línea · Etiqueta VNG Store en el cuello · Logotipo VNG en la manga",
    0,
    [
      ["/products/camiseta-angel-frontal.jpg", "Camiseta Ángel VNG, vista frontal"],
      ["/products/camiseta-angel-doblada.jpg", "Camiseta Ángel VNG doblada, detalle de manga"],
    ],
    ["XS", "S", "M", "L", "XL"].map((s) => [s, "Crudo"] as [string, string]),
  ),
  product(
    2,
    "tote-angel",
    "Tote Bag Ángel",
    "Bolsa de lona color natural con la ilustración del ángel en un solo trazo.",
    "Asas largas para llevar al hombro · Ilustración a una línea",
    1,
    [["/products/tote-angel.jpg", "Tote bag Ángel VNG"]],
    [["Única", "Natural"]],
  ),
  product(
    3,
    "colgante-trebol",
    "Colgante Trébol",
    "Colgante en forma de trébol de cuatro hojas con corazones calados y circonita brillante engastada en el centro. Incluye plaquita grabada VNG.",
    "Altura del colgante: 2,0 cm · Plaquita VNG: 5 × 8 mm · Circonita engastada",
    2,
    [["/products/colgante-trebol.jpg", "Colgante Trébol VNG con circonita"]],
    [["Única", "Plateado"]],
  ),
];
