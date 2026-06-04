// Catalog read API (server). Reads from Firestore via firebase-admin when
// configured, otherwise falls back to seed data so the storefront always
// renders. Pure filter/facet helpers live in lib/product-utils (client-safe).
import "server-only";
import { cache } from "react";
import type { Collection, Product } from "@/types";
import { seedCollections, seedProducts } from "@/data/seed";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { filterProducts } from "@/lib/product-utils";

export type { ProductFilters } from "@/lib/product-utils";
export { facetsOf } from "@/lib/product-utils";

// Deduped per-request reads (React cache). Falls back to seed on any error.
const fetchAllProducts = cache(async (): Promise<Product[]> => {
  if (!isAdminConfigured()) return seedProducts;
  try {
    const snap = await adminDb().collection("products").get();
    const docs = snap.docs.map((d) => d.data() as Product);
    return docs.length ? docs : seedProducts;
  } catch (err) {
    console.error("[catalog] Firestore products read failed, using seed:", err);
    return seedProducts;
  }
});

const fetchAllCollections = cache(async (): Promise<Collection[]> => {
  if (!isAdminConfigured()) return seedCollections;
  try {
    const snap = await adminDb().collection("collections").get();
    const docs = snap.docs.map((d) => d.data() as Collection);
    return docs.length ? docs : seedCollections;
  } catch (err) {
    console.error("[catalog] Firestore collections read failed, using seed:", err);
    return seedCollections;
  }
});

async function activeProducts(): Promise<Product[]> {
  return (await fetchAllProducts()).filter((p) => p.status === "active");
}

export async function getAllProducts(): Promise<Product[]> {
  return activeProducts();
}

export async function getProductByHandle(
  handle: string,
): Promise<Product | null> {
  return (await activeProducts()).find((p) => p.handle === handle) ?? null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const all = await activeProducts();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getCollections(): Promise<Collection[]> {
  return [...(await fetchAllCollections())].sort((a, b) => a.position - b.position);
}

export async function getCollectionByHandle(
  handle: string,
): Promise<Collection | null> {
  return (await fetchAllCollections()).find((c) => c.handle === handle) ?? null;
}

export async function getProductsByCollection(
  handle: string,
): Promise<Product[]> {
  return (await activeProducts()).filter((p) =>
    p.collectionHandles.includes(handle),
  );
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const all = await activeProducts();
  const sameCollection = all.filter(
    (p) =>
      p.id !== product.id &&
      p.collectionHandles.some((h) => product.collectionHandles.includes(h)),
  );
  const pool = sameCollection.length
    ? sameCollection
    : all.filter((p) => p.id !== product.id);
  return pool.slice(0, limit);
}

export async function searchProducts(q: string): Promise<Product[]> {
  return filterProducts(await activeProducts(), { q });
}
