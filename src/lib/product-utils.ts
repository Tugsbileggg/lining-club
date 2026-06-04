// Pure, client-safe product helpers (no server/firebase imports). Used by both
// server data layer and client components (filters/browser).
import type { Product } from "@/types";

export interface ProductFilters {
  q?: string;
  sizes?: string[];
  vendors?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "featured" | "price-asc" | "price-desc" | "title-asc";
}

export function filterProducts(
  base: Product[],
  filters: ProductFilters,
): Product[] {
  let out = [...base];
  const q = filters.q?.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.vendor.toLowerCase().includes(q) ||
        p.productType.toLowerCase().includes(q),
    );
  }
  if (filters.sizes?.length) {
    out = out.filter((p) => p.sizes.some((s) => filters.sizes!.includes(s)));
  }
  if (filters.vendors?.length) {
    out = out.filter((p) => filters.vendors!.includes(p.vendor));
  }
  if (typeof filters.minPrice === "number") {
    out = out.filter((p) => p.price >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === "number") {
    out = out.filter((p) => p.price <= filters.maxPrice!);
  }
  switch (filters.sort) {
    case "price-asc":
      out.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      out.sort((a, b) => b.price - a.price);
      break;
    case "title-asc":
      out.sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      out.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
  return out;
}

/** Distinct facet values across a product set, for filter UIs. */
export function facetsOf(products: Product[]) {
  const sizes = new Set<string>();
  const vendors = new Set<string>();
  for (const p of products) {
    p.sizes.forEach((s) => sizes.add(s));
    vendors.add(p.vendor);
  }
  const sortSizes = (a: string, b: string) =>
    (parseFloat(a) || 0) - (parseFloat(b) || 0);
  return {
    sizes: [...sizes].sort(sortSizes),
    vendors: [...vendors].sort(),
  };
}
