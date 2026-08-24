import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { getCurrentAdmin, isAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { orderNotificationEmail, orderNotifyRecipients } from "@/lib/emails/order";
import type { Order } from "@/types";

export const runtime = "nodejs";

// Admin-only: email settings are critical configuration, and an open endpoint
// that sends mail to any address is an obvious abuse vector.
async function guard() {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Зөвхөн админ хандах эрхтэй" }, { status: 403 });
  }
  return null;
}

function emailConfig() {
  const provider = (process.env.EMAIL_PROVIDER || "console").toLowerCase();
  return {
    provider,
    /** True only when mail can actually leave the building. */
    delivers: provider === "resend" && Boolean(process.env.RESEND_API_KEY),
    from: process.env.EMAIL_FROM || "Lining Club <orders@example.com>",
    notifyTo: orderNotifyRecipients(),
  };
}

/** Current email wiring, for the admin card. Never exposes the API key. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const user = await getCurrentAdmin();
  // The signed-in admin is the obvious default target for a test send.
  return NextResponse.json({ ...emailConfig(), adminEmail: user?.email ?? "" });
}

const bodySchema = z.object({ to: z.string().email("И-мэйл буруу байна") });

/** A sample order lets the admin see exactly what a real notification looks like. */
function sampleOrder(): Order {
  const now = Date.now();
  return {
    id: "sample",
    orderNumber: "LC-TEST01",
    status: "pending",
    customer: {
      name: "Тест Хэрэглэгч",
      phone: "8800 0000",
      email: "test@example.com",
      address: "СБД, 1-р хороо, 12-р байр",
      city: "Улаанбаатар",
      note: "Энэ бол тест захиалга — бодит захиалга биш.",
    },
    items: [
      {
        productId: "sample",
        handle: "sample",
        title: "Тест бараа",
        variantId: "sample",
        size: "42",
        image: "",
        price: 5000,
        quantity: 1,
      },
    ],
    subtotal: 5000,
    shipping: 0,
    total: 5000,
    payment: { provider: "manual", status: "unpaid", paidAt: null },
    createdAt: now,
    updatedAt: now,
  };
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const { to } = bodySchema.parse(await req.json());
    const config = emailConfig();

    const { subject, html, text } = orderNotificationEmail(sampleOrder());
    const sent = await sendEmail({
      to,
      subject: `[ТЕСТ] ${subject}`,
      html,
      text,
    });

    // sendEmail swallows its own errors and the console provider always
    // "succeeds", so report the provider too — otherwise a console-only setup
    // looks identical to real delivery.
    return NextResponse.json({
      sent,
      to,
      provider: config.provider,
      delivers: config.delivers,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "И-мэйл хаяг буруу байна" }, { status: 422 });
    }
    console.error("[api/admin/email/test] failed:", err);
    return NextResponse.json({ error: "Илгээхэд алдаа гарлаа" }, { status: 500 });
  }
}
