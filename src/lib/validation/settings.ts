import { z } from "zod";

const optionalUrl = z
  .string()
  .url("Холбоос буруу байна")
  .max(300)
  .optional()
  .or(z.literal(""));

export const settingsSchema = z.object({
  announcement: z.string().max(200).optional().or(z.literal("")),
  shippingText: z.string().min(1, "Хүргэлтийн текст оруулна уу").max(1000),
  returnsText: z.string().min(1, "Буцаалтын текст оруулна уу").max(1000),
  contact: z.object({
    phone: z.string().min(4, "Утас оруулна уу").max(40),
    address: z.string().max(200).optional().or(z.literal("")),
    facebook: optionalUrl,
    instagram: optionalUrl,
  }),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
