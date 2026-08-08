import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { getOrderForPayment } from "@/services/orders";
import { PaymentError, startQpayCheckout } from "@/services/payment";
import { WireError } from "@/lib/payments/wire";

export const runtime = "nodejs";

// Public endpoint — guests never authenticate. Access is gated by the
// per-order payment token issued at checkout, not by the order number (which
// is short and partly time-derived, so it must not be the only secret).
// Returns a pay.wire.mn URL and nothing else — no customer PII.
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

    if (order.payment.status === "paid") {
      return NextResponse.json({ status: "paid", amount: order.total });
    }

    const checkout = await startQpayCheckout(order);
    return NextResponse.json({
      status: checkout.status,
      amount: order.total,
      orderNumber: order.orderNumber,
      url: checkout.url ?? null,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Хүсэлт буруу байна" }, { status: 422 });
    }
    if (err instanceof PaymentError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof WireError) {
      console.error(
        `[api/payments/qpay/session] wire ${err.status} ${err.code ?? "-"} (request_id=${err.requestId ?? "-"}): ${err.message}`,
      );
      return NextResponse.json(
        { error: "Төлбөрийн үйлчилгээ түр ажиллахгүй байна. Дахин оролдоно уу." },
        { status: 502 },
      );
    }
    console.error("[api/payments/qpay/session] failed:", err);
    return NextResponse.json(
      { error: "Төлбөрийн хуудас нээхэд алдаа гарлаа" },
      { status: 500 },
    );
  }
}
