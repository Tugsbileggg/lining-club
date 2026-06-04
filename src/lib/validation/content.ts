import { z } from "zod";

// Image hosts allowed by next.config.ts `images.remotePatterns`. Validating the
// hero image host on save guarantees the homepage <Image> never errors on a
// domain Next can't optimize.
export const ALLOWED_IMAGE_HOSTS = [
  "cdn.shopify.com",
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
];

const heroImage = z
  .string()
  .url("Зургийн холбоос буруу байна")
  .refine((u) => {
    try {
      return ALLOWED_IMAGE_HOSTS.includes(new URL(u).hostname);
    } catch {
      return false;
    }
  }, "Зураг cdn.shopify.com эсвэл Firebase Storage хаягтай байх ёстой");

const ctaHref = z
  .string()
  .min(1, "Холбоос оруулна уу")
  .max(300)
  .refine(
    (v) => v.startsWith("/") || /^https?:\/\//.test(v),
    "Холбоос '/'-ээр эхлэх эсвэл бүтэн URL байх ёстой",
  );

export const heroSchema = z.object({
  eyebrow: z.string().max(60),
  heading: z.string().min(1, "Гарчиг оруулна уу").max(120),
  subheading: z.string().max(300),
  image: heroImage,
  ctaLabel: z.string().min(1, "Товчны текст оруулна уу").max(40),
  ctaHref,
});

export type HeroInput = z.infer<typeof heroSchema>;
