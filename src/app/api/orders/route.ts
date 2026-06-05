import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { orderInputSchema } from "@/lib/validation/order";
import { createOrder, OrderError } from "@/services/orders";
import { notifyOrder } from "@/lib/emails/order";

export const runtime = "nodejs";

// Public guest-checkout endpoint. No auth — orders are created via the admin
// SDK server-side (bypasses Firestore rules). Prices are re-derived from the
// catalog inside createOrder, so the client cannot dictate amounts.
// TODO(backend): basic rate limiting / abuse protection.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = orderInputSchema.parse(body);
    const order = await createOrder(input);
    // Confirmation + store notification. Never throws (failure is logged only).
    await notifyOrder(order);
    return NextResponse.json(
      {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          subtotal: order.subtotal,
          shipping: order.shipping,
          total: order.total,
          items: order.items,
          createdAt: order.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Талбар буруу байна", issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[api/orders] create failed:", err);
    return NextResponse.json(
      { error: "Захиалга үүсгэхэд алдаа гарлаа" },
      { status: 500 },
    );
  }
}
