import { z } from "zod";

export const productInputSchema = z.object({
  title: z.string().min(1, "Гарчиг шаардлагатай"),
  handle: z
    .string()
    .min(1, "Handle шаардлагатай")
    .regex(/^[a-z0-9-]+$/, "Зөвхөн жижиг латин үсэг, тоо, зураас"),
  vendor: z.string().min(1, "Брэнд шаардлагатай"),
  productType: z.string().min(1, "Төрөл шаардлагатай"),
  description: z.string().max(5000).default(""),
  price: z.number().int().nonnegative("Үнэ 0-ээс багагүй"),
  compareAtPrice: z.number().int().nonnegative().nullable().default(null),
  collectionHandles: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  images: z.array(z.string().url("Зургийн URL буруу")).default([]),
  featured: z.boolean().default(false),
  status: z.enum(["active", "draft", "archived"]).default("active"),
});

export type ProductInput = z.infer<typeof productInputSchema>;
