import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductBrowser } from "@/components/product/product-browser";
import {
  getCollectionByHandle,
  getProductsByCollection,
} from "@/services/catalog";

interface Params {
  params: Promise<{ handle: string }>;
}

/**
 * Rendered per request rather than cached.
 *
 * These pages were previously prerendered and refreshed by revalidatePath on
 * every product save. That kept missing: a newly added product stayed invisible
 * in its category until the next deploy rebuilt the page, with nothing to
 * indicate why. Neither the route-pattern nor the concrete-path form of the
 * call invalidated them in production, and a time-based ISR window did not
 * rescue it either.
 *
 * A category page costs one Firestore read of a small catalog, so paying that
 * per request buys correctness that three attempts at cache invalidation did
 * not. Revisit only if these pages ever get hot enough to measure.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCollectionByHandle(decodeURIComponent(handle));
  return { title: collection?.title ?? "Ангилал" };
}

export default async function CollectionPage({ params }: Params) {
  const { handle } = await params;
  const decoded = decodeURIComponent(handle);
  const collection = await getCollectionByHandle(decoded);
  if (!collection) notFound();

  const products = await getProductsByCollection(decoded);
  return (
    <ProductBrowser
      products={products}
      title={collection.title}
      description={collection.description}
    />
  );
}
