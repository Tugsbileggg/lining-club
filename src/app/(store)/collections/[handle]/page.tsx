import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductBrowser } from "@/components/product/product-browser";
import {
  getCollectionByHandle,
  getCollections,
  getProductsByCollection,
} from "@/services/catalog";

interface Params {
  params: Promise<{ handle: string }>;
}

/**
 * Safety net. Saving a product revalidates these pages explicitly, but that
 * has silently missed before, which left a new product invisible in its
 * category indefinitely. An hour-scale staleness bound is not enough for a
 * shop owner watching for their upload, so re-check every minute.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ handle: c.handle }));
}

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
