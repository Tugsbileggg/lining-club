// Editable site content (server). Stored in `content/home` (the `hero` field).
// Read by the storefront home page; written by admin/staff.
import "server-only";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import type { HeroContent } from "@/types";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { HeroInput } from "@/lib/validation/content";

const DOC = "home";

/** Matches the original hardcoded hero; used until an admin saves changes. */
export const DEFAULT_HERO: HeroContent = {
  eyebrow: "Lining Club",
  heading: "Шинэ улирлын пүүз",
  subheading:
    "Чанартай, загварлаг пүүз, гутлын цуглуулга. Улаанбаатар даяар хүргэлттэй.",
  image:
    "https://cdn.shopify.com/s/files/1/0821/3053/4648/files/HeroCategory-Mobile_1x1_757943AACAG9055_001_Default.jpg?v=1776154539",
  ctaLabel: "Дэлгүүр хэсэх",
  ctaHref: "/products",
};

export const getHero = cache(async (): Promise<HeroContent> => {
  if (!isAdminConfigured()) return DEFAULT_HERO;
  try {
    const doc = await adminDb().collection("content").doc(DOC).get();
    const hero = doc.exists
      ? (doc.data()?.hero as Partial<HeroContent> | undefined)
      : undefined;
    return { ...DEFAULT_HERO, ...(hero ?? {}) };
  } catch (err) {
    console.error("[content] hero read failed, using default:", err);
    return DEFAULT_HERO;
  }
});

export async function updateHero(input: HeroInput): Promise<HeroContent> {
  await adminDb().collection("content").doc(DOC).set({ hero: input }, { merge: true });
  revalidatePath("/");
  return { ...DEFAULT_HERO, ...input };
}
