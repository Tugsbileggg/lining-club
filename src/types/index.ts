// ──────────────────────────────────────────────────────────────
// Domain types — shared across storefront, admin, services and API.
// Prices are integers in MNT (Mongolian Tögrög); MNT has no minor unit.
// ──────────────────────────────────────────────────────────────

export type ID = string;

/** ISO date string or epoch millis, depending on layer. Services normalize to ms. */
export type Timestampish = number;

export type ProductStatus = "active" | "draft" | "archived";

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductOption {
  /** e.g. "Хэмжээ" (Size) or "Өнгө" (Color) */
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: ID;
  title: string;
  /** Shoe size, e.g. "42" or "42.5". */
  size?: string;
  /** Color name, e.g. "Хар". */
  color?: string;
  price: number;
  compareAtPrice?: number | null;
  available: boolean;
}

export interface Product {
  id: ID;
  handle: string;
  title: string;
  /** May contain limited HTML (sanitized on render). */
  description: string;
  vendor: string;
  productType: string;
  /** Collection handles this product belongs to. */
  collectionHandles: string[];
  price: number;
  compareAtPrice?: number | null;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  /** Convenience projections derived from variants/options. */
  sizes: string[];
  colors: string[];
  featured: boolean;
  status: ProductStatus;
  createdAt: Timestampish;
  updatedAt: Timestampish;
}

export interface Collection {
  id: ID;
  handle: string;
  title: string;
  description: string;
  image?: ProductImage | null;
  /** Optional explicit ordering; otherwise products are matched by handle. */
  productIds?: ID[];
  position: number;
}

// ── Cart ──────────────────────────────────────────────────────
export interface CartItem {
  /** Stable line id = `${productId}:${variantId}`. */
  lineId: string;
  productId: ID;
  handle: string;
  title: string;
  image: string;
  variantId: ID;
  size?: string;
  color?: string;
  price: number;
  quantity: number;
}

// ── Orders ────────────────────────────────────────────────────
export type OrderStatus =
  | "pending"
  | "accepted"
  | "fulfilled"
  | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed";

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  note?: string;
}

export interface OrderItem {
  productId: ID;
  handle: string;
  title: string;
  variantId: ID;
  size?: string;
  color?: string;
  image: string;
  price: number;
  quantity: number;
}

export interface OrderPayment {
  provider: "qpay" | "manual";
  status: PaymentStatus;
  invoiceId?: string;
  paidAt?: Timestampish | null;
}

export interface Order {
  id: ID;
  orderNumber: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment: OrderPayment;
  createdAt: Timestampish;
  updatedAt: Timestampish;
}

// ── Reviews ───────────────────────────────────────────────────
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: ID;
  productId: ID;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  body: string;
  status: ReviewStatus;
  createdAt: Timestampish;
}

// ── Admin / RBAC ──────────────────────────────────────────────
export type AdminRole = "admin" | "staff";

export interface Admin {
  uid: ID;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: Timestampish;
}

// ── Settings / content ────────────────────────────────────────
export interface Banner {
  id: ID;
  image: string;
  mobileImage?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

// ── Editable content ──────────────────────────────────────────
/** Home hero block, editable from the admin content editor. */
export interface HeroContent {
  /** Small uppercase label above the heading, e.g. "Lining Club". */
  eyebrow: string;
  heading: string;
  subheading: string;
  /** Background image URL (must be an allowed image host). */
  image: string;
  ctaLabel: string;
  /** Internal path ("/products") or absolute URL. */
  ctaHref: string;
}

export interface Settings {
  shippingText: string;
  returnsText: string;
  contact: {
    phone: string;
    facebook?: string;
    instagram?: string;
    address?: string;
  };
  announcement?: string;
  banners: Banner[];
}
