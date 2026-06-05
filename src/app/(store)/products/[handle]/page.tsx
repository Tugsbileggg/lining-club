import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductBuyBox } from "@/components/product/product-buy-box";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeading } from "@/components/home/section-heading";
import { ReviewSection } from "@/components/reviews/review-section";
import {
  getAllProducts,
  getProductByHandle,
  getRelatedProducts,
} from "@/services/catalog";
import { getApprovedReviews } from "@/services/reviews";

interface Params {
  params: Promise<{ handle: string }>;
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(decodeURIComponent(handle));
  if (!product) return { title: "Бараа олдсонгүй" };
  return {
    title: product.title,
    description: product.description,
    openGraph: { images: product.images.map((i) => i.url) },
  };
}

export default async function ProductPage({ params }: Params) {
  const { handle } = await params;
  const product = await getProductByHandle(decodeURIComponent(handle));
  if (!product) notFound();

  const [related, reviews] = await Promise.all([
    getRelatedProducts(product, 4),
    getApprovedReviews(product.id),
  ]);

  return (
    <div>
      <div className="container-page pt-6">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Нүүр
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/products" className="hover:text-foreground">
            Бараа
          </Link>
          <ChevronRight className="size-3" />
          <span className="truncate text-foreground">{product.title}</span>
        </nav>
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} title={product.title} />
        <ProductBuyBox product={product} />
      </div>

      {related.length > 0 && (
        <section className="container-page py-12">
          <SectionHeading title="Холбоотой бараа" />
          <ProductGrid products={related} priorityCount={0} />
        </section>
      )}

      <ReviewSection productId={product.id} initialReviews={reviews} />
    </div>
  );
}
