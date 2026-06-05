import { z } from "zod";

export const reviewInputSchema = z.object({
  productId: z.string().min(1),
  author: z.string().min(2, "Нэрээ оруулна уу").max(60),
  rating: z.number().int().min(1, "Үнэлгээ өгнө үү").max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z.string().min(3, "Сэтгэгдлээ бичнэ үү").max(2000),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

/** Admin moderation target status. */
export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;

export const reviewModerateSchema = z.object({
  status: z.enum(REVIEW_STATUSES),
});

export type ReviewModerate = z.infer<typeof reviewModerateSchema>;
