import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getHero } from "@/services/content";

export async function Hero() {
  const hero = await getHero();

  return (
    <section className="relative h-[70vh] min-h-[420px] w-full overflow-hidden bg-neutral-900">
      <Image
        src={hero.image}
        alt={hero.heading}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-90"
      />
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
