export type ProductStatus = "draft" | "active" | "archived";
export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  position: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  storage_path: string | null;
  alt: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock: number;
  price_cents: number | null;
  position: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: string;
  category_id: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  status: ProductStatus;
  featured: boolean;
  is_new: boolean;
  sales_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
  categories?: Pick<Category, "id" | "slug" | "name"> | null;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  approved: boolean;
  created_at: string;
  products?: { name: string; slug: string } | null;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order_cents: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  image_url: string | null;
  unit_price_cents: number;
  quantity: number;
}

export interface ShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

export interface Order {
  id: string;
  order_number: number;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  coupon_code: string | null;
  shipping_name: string | null;
  shipping_address: ShippingAddress | null;
  phone: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  order_status_history?: { id: string; status: string; note: string | null; created_at: string }[];
}

export interface Settings {
  shipping_cents: number;
  free_shipping_threshold_cents: number | null;
}

/** Línea del carrito guardada en el navegador (solo identificadores y cantidad; precios se recalculan en servidor). */
export interface CartLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantLabel: string;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
  maxStock: number;
}

/** Normaliza el resultado de una consulta a un array tipado. */
export function rows<T>(data: unknown): T[] {
  return (Array.isArray(data) ? data : []) as T[];
}
