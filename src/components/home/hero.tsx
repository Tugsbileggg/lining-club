import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getHero } from "@/services/content";
import { getFeaturedProducts } from "@/services/catalog";
import { HeroSlideshow } from "./hero-slideshow";

/** How many featured products take turns as the hero background. */
const SLIDE_COUNT = 3;

export async function Hero() {
  const [hero, featured] = await Promise.all([
    getHero(),
    getFeaturedProducts(),
  ]);

  // The newest arrivals out of the featured section rotate behind the heading.
  // Falls back to the admin-managed hero image when none of them has a photo.
  const slides = featured
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((p) => p.images[0]?.url)
    .filter((url): url is string => Boolean(url))
    .slice(0, SLIDE_COUNT);

  return (
    <section className="relative h-[70vh] min-h-[420px] w-full overflow-hidden bg-neutral-900">
      <HeroSlideshow images={slides.length ? slides : [hero.image]} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="container-page relative flex h-full flex-col items-start justify-end pb-14 text-white">
        {hero.eyebrow && (
          <p className="text-sm font-medium uppercase tracking-widest text-white/80">
            {hero.eyebrow}
          </p>
        )}
        <h1 className="mt-2 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
          {hero.heading}
        </h1>
        {hero.subheading && (
          <p className="mt-3 max-w-md text-sm text-white/85 sm:text-base">
            {hero.subheading}
          </p>
        )}
        {hero.ctaLabel && (
          <Button asChild size="xl" variant="secondary" className="mt-6">
            <Link href={hero.ctaHref || "/products"}>{hero.ctaLabel}</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
