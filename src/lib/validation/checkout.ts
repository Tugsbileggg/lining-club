import { z } from "zod";

/** Mongolian phone: 8 digits, optional +976 / 976 prefix and spaces. */
const phoneRegex = /^(\+?976)?[\s-]?\d{4}[\s-]?\d{4}$/;

/** Recipient/contact fields — shared by the checkout form and the orders API. */
export const customerSchema = z.object({
  name: z.string().min(2, "Нэрээ оруулна уу"),
  phone: z
    .string()
    .min(8, "Утасны дугаар оруулна уу")
    .regex(phoneRegex, "Утасны дугаар буруу байна"),
  email: z
    .string()
    .email("И-мэйл буруу байна")
    .optional()
    .or(z.literal("")),
  city: z.string().min(2, "Хот / аймаг оруулна уу"),
  address: z.string().min(5, "Дэлгэрэнгүй хаяг оруулна уу"),
  note: z.string().max(500).optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const checkoutSchema = customerSchema.extend({
  paymentMethod: z.enum(["qpay", "manual"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
