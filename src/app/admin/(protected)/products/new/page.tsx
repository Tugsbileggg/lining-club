import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCollections } from "@/services/catalog";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const collections = await getCollections();
  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Бараа
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Шинэ бараа</h1>
      <ProductForm collections={collections} />
    </div>
  );
}
