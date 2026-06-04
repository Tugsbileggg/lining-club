import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentAdmin, isAdmin } from "@/lib/auth";
import { productInputSchema } from "@/lib/validation/product";
import { updateProduct, deleteProduct } from "@/services/products";

export const runtime = "nodejs";

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
    const input = productInputSchema.parse(body);
    const product = await updateProduct(id, input);
    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Талбар буруу", issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    console.error("[api/products] update failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  // Deletion is admin-only (staff may add/edit but not delete).
  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: "Зөвхөн админ устгах эрхтэй" },
      { status: 403 },
    );
  }
  const { id } = await params;
  try {
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/products] delete failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
