import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentAdmin, isAdmin } from "@/lib/auth";
import { orderUpdateSchema } from "@/lib/validation/order";
import { updateOrder, deleteOrder, OrderError } from "@/services/orders";

export const runtime = "nodejs";

// Update an order's status and/or payment status (staff or admin).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const patch = orderUpdateSchema.parse(body);
    const order = await updateOrder(id, patch);
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Төлөв буруу байна", issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[api/admin/orders] update failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

// Delete an order (admin-only), mirroring the products convention.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: "Зөвхөн админ устгах эрхтэй" },
      { status: 403 },
    );
  }
  const { id } = await params;
  try {
    await deleteOrder(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/orders] delete failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
