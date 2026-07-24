import { Hero } from "@/components/home/hero";
import { SectionHeading } from "@/components/home/section-heading";
import { CollectionCard } from "@/components/home/collection-card";
import { ProductGrid } from "@/components/product/product-grid";
import {
  getCollections,
  getFeaturedProducts,
  getProductsByCollection,
} from "@/services/catalog";

/** Shown on a category tile when the category has no product image yet. */
const STORE_LOGO = "/logo.png";

export default async function HomePage() {
  const [featured, collections] = await Promise.all([
    getFeaturedProducts(8),
    getCollections(),
  ]);

  // Tile image per collection: the most recently added product that actually
  // has an image, so a category cover follows its newest arrival. Categories
  // with no usable product image fall back to the store logo.
  const tiles = await Promise.all(
    collections
      .filter((c) => c.handle !== "all-sneakers")
      .map(async (c) => {
        const products = await getProductsByCollection(c.handle);
        const newestImage = [...products]
          .sort((a, b) => b.createdAt - a.createdAt)
          .find((p) => p.images[0]?.url)?.images[0]?.url;
        return { ...c, image: newestImage ?? STORE_LOGO, isLogo: !newestImage };
      }),
  );

  return (
    <>
      <Hero />

      {featured.length > 0 && (
        <section className="container-page py-14">
          <SectionHeading title="Онцлох бараа" href="/products" />
          <ProductGrid products={featured} />
        </section>
      )}

      <section className="container-page py-14">
        <SectionHeading title="Ангилал" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {tiles.map((c) => (
            <CollectionCard
              key={c.id}
              title={c.title}
              href={`/collections/${c.handle}`}
              image={c.image}
              logo={c.isLogo}
            />
          ))}
        </div>
      </section>
    </>
  );
}
