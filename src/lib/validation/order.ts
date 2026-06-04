import { z } from "zod";
import { customerSchema } from "./checkout";

/**
 * Order line as submitted by the client. Only references are trusted —
 * price/title/image are re-derived server-side from the live catalog so a
 * tampered client cannot set its own prices.
 */
export const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1, "Тоо ширхэг буруу").max(99),
});

export const orderInputSchema = z.object({
  customer: customerSchema,
  items: z.array(orderItemInputSchema).min(1, "Сагс хоосон байна"),
  paymentMethod: z.enum(["qpay", "manual"]),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

/** Allowed order statuses, in lifecycle order (cancelled is terminal). */
export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "fulfilled",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed"] as const;

/** Partial admin update — at least one of status / paymentStatus required. */
export const orderUpdateSchema = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  })
  .refine((v) => v.status !== undefined || v.paymentStatus !== undefined, {
    message: "Шинэчлэх талбар алга",
  });

export type OrderUpdate = z.infer<typeof orderUpdateSchema>;
