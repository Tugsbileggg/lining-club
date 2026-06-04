import type { Metadata } from "next";
import { ProductBrowser } from "@/components/product/product-browser";
import { getAllProducts, searchProducts } from "@/services/catalog";

export const metadata: Metadata = { title: "Хайлт" };

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const products = query ? await searchProducts(query) : await getAllProducts();

  return (
    <ProductBrowser
      products={products}
      title={query ? `“${query}” хайлт` : "Бүх бараа"}
      description={query ? `${products.length} илэрц олдлоо` : undefined}
    />
  );
}
