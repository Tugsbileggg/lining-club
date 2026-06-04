// Admin product write/list service (server). Storefront reads live in catalog.ts.
import "server-only";
import { revalidatePath } from "next/cache";
import type { Product, ProductVariant } from "@/types";
import { adminDb } from "@/lib/firebase/admin";
import type { ProductInput } from "@/lib/validation/product";

const COLLECTION = "products";

/** All products incl. draft/archived — for the admin list. */
export async function listAllProducts(): Promise<Product[]> {
  const snap = await adminDb().collection(COLLECTION).get();
  return snap.docs
    .map((d) => d.data() as Product)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProductById(id: string): Promise<Product | null> {
  const doc = await adminDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? (doc.data() as Product) : null;
}

function buildProduct(
  id: string,
  input: ProductInput,
  createdAt: number,
): Product {
  const variants: ProductVariant[] = input.sizes.length
    ? input.sizes.map((size) => ({
        id: `${id}-${size}`,
        title: size,
        size,
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        available: true,
      }))
    : [
        {
          id: `${id}-default`,
          title: "Default",
          price: input.price,
          compareAtPrice: input.compareAtPrice,
          available: true,
        },
      ];

  return {
    id,
    handle: input.handle,
    title: input.title,
    description: input.description,
    vendor: input.vendor,
    productType: input.productType,
    collectionHandles: input.collectionHandles,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    images: input.images.map((url) => ({ url })),
    options: input.sizes.length ? [{ name: "Хэмжээ", values: input.sizes }] : [],
    variants,
    sizes: input.sizes,
    colors: [],
    featured: input.featured,
    status: input.status,
    createdAt,
    updatedAt: Date.now(),
  };
}

function revalidateStorefront(handle?: string) {
  revalidatePath("/");
  revalidatePath("/products");
  if (handle) revalidatePath(`/products/${handle}`);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const ref = adminDb().collection(COLLECTION).doc();
  const product = buildProduct(ref.id, input, Date.now());
  await ref.set(product);
  revalidateStorefront(product.handle);
  return product;
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  const existing = await getProductById(id);
  const product = buildProduct(id, input, existing?.createdAt ?? Date.now());
  await adminDb().collection(COLLECTION).doc(id).set(product);
  revalidateStorefront(product.handle);
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  await adminDb().collection(COLLECTION).doc(id).delete();
  revalidateStorefront();
}
