import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentAdmin, isAdmin } from "@/lib/auth";
import { updateRoleSchema } from "@/lib/validation/staff";
import { updateRole, revokeAccess, StaffError } from "@/services/staff";

export const runtime = "nodejs";

// Change a user's role (admin-only). Cannot change your own role (lockout guard).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Зөвхөн админ" }, { status: 403 });
  }
  const { uid } = await params;
  if (uid === user.uid) {
    return NextResponse.json(
      { error: "Та өөрийн эрхээ өөрчлөх боломжгүй" },
      { status: 400 },
    );
  }
  try {
    const body = await req.json();
    const { role } = updateRoleSchema.parse(body);
    const admin = await updateRole(uid, role);
    return NextResponse.json({ admin });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Эрх буруу байна", issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    if (err instanceof StaffError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[api/admin/staff] update failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

// Revoke a user's access (admin-only). Cannot revoke yourself.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Зөвхөн админ" }, { status: 403 });
  }
  const { uid } = await params;
  if (uid === user.uid) {
    return NextResponse.json(
      { error: "Та өөрийн эрхээ хураах боломжгүй" },
      { status: 400 },
    );
  }
  try {
    await revokeAccess(uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/staff] revoke failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
