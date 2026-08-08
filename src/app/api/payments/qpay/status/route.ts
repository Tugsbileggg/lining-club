import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { getOrderForPayment } from "@/services/orders";
import { syncQpayPayment } from "@/services/payment";

export const runtime = "nodejs";

// Polled by the QR page every few seconds. POST rather than GET so the payment
// token stays out of URLs, access logs and referrer headers.
const bodySchema = z.object({
  orderNumber: z.string().min(1),
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { orderNumber, token } = bodySchema.parse(await req.json());
    const order = await getOrderForPayment(orderNumber, token);
    if (!order) {
      return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
    }

    // Asks Wire directly, then mirrors the result onto the order.
    const { order: synced } = await syncQpayPayment(order);
    return NextResponse.json({ status: synced.payment.status });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Хүсэлт буруу байна" }, { status: 422 });
    }
    console.error("[api/payments/qpay/status] failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
