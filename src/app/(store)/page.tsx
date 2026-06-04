import { Hero } from "@/components/home/hero";
import { SectionHeading } from "@/components/home/section-heading";
import { CollectionCard } from "@/components/home/collection-card";
import { ProductGrid } from "@/components/product/product-grid";
import {
  getCollections,
  getFeaturedProducts,
  getProductsByCollection,
} from "@/services/catalog";

export default async function HomePage() {
  const [featured, collections] = await Promise.all([
    getFeaturedProducts(8),
    getCollections(),
  ]);

  // Representative image per collection (first product's first image).
  const tiles = await Promise.all(
    collections
      .filter((c) => c.handle !== "all-sneakers")
      .map(async (c) => {
        const products = await getProductsByCollection(c.handle);
        return {
          ...c,
          image: c.image?.url ?? products[0]?.images[0]?.url,
        };
      }),
  );

  return (
    <>
      <Hero />

      <section className="container-page py-14">
        <SectionHeading title="Онцлох бараа" href="/products" />
        <ProductGrid products={featured} />
      </section>

      <section className="container-page py-14">
        <SectionHeading title="Ангилал" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {tiles.map((c) => (
            <CollectionCard
              key={c.id}
              title={c.title}
              href={`/collections/${c.handle}`}
              image={c.image}
            />
          ))}
        </div>
      </section>
    </>
  );
}
