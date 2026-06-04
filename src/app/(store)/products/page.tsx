import type { Metadata } from "next";
import { ProductBrowser } from "@/components/product/product-browser";
import { getAllProducts } from "@/services/catalog";

export const metadata: Metadata = { title: "Бүх бараа" };

export default async function ProductsPage() {
  const products = await getAllProducts();
  return <ProductBrowser products={products} title="Бүх бараа" />;
}
