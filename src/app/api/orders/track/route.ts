import { NextResponse, type NextRequest } from "next/server";
import { getOrderByNumber } from "@/services/orders";

export const runtime = "nodejs";

// Public order tracking. Returns status + a minimal item summary only —
// never the customer's name/phone/address.
export async function GET(req: NextRequest) {
  const number = req.nextUrl.searchParams.get("number")?.trim();
  if (!number) {
    return NextResponse.json(
      { error: "Захиалгын дугаар оруулна уу" },
      { status: 400 },
    );
  }

  const order = await getOrderByNumber(number).catch((err) => {
    console.error("[api/orders/track] lookup failed:", err);
    return null;
  });

  if (!order) {
    return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      total: order.total,
      items: order.items.map((i) => ({
        title: i.title,
        size: i.size,
        quantity: i.quantity,
      })),
    },
  });
}
