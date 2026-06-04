import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCollections } from "@/services/catalog";
import { getProductById } from "@/services/products";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, collections] = await Promise.all([
    getProductById(id),
    getCollections(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Бараа
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Бараа засах</h1>
      <ProductForm collections={collections} product={product} />
    </div>
  );
}
