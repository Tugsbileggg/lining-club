import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { reviewModerateSchema } from "@/lib/validation/review";
import { updateReviewStatus, deleteReview } from "@/services/reviews";

export const runtime = "nodejs";

// Moderate a review (approve / reject / reset). Staff or admin.
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
    const { status } = reviewModerateSchema.parse(body);
    const review = await updateReviewStatus(id, status);
    return NextResponse.json({ review });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Төлөв буруу байна", issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    console.error("[api/admin/reviews] update failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

// Delete a review (staff or admin, per Firestore rules).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await deleteReview(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/reviews] delete failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
