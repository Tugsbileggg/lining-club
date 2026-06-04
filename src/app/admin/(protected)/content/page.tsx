import { getHero } from "@/services/content";
import { HeroForm } from "@/components/admin/hero-form";
import type { HeroInput } from "@/lib/validation/content";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const hero = await getHero();
  const initial: HeroInput = {
    eyebrow: hero.eyebrow,
    heading: hero.heading,
    subheading: hero.subheading,
    image: hero.image,
    ctaLabel: hero.ctaLabel,
    ctaHref: hero.ctaHref,
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Контент</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Нүүр хуудасны эхний хэсэг (hero) — зураг, гарчиг, товч.
        </p>
      </div>
      <div className="mt-6">
        <HeroForm initial={initial} />
      </div>
    </div>
  );
}
