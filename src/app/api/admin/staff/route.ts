import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentAdmin, isAdmin } from "@/lib/auth";
import { grantStaffSchema } from "@/lib/validation/staff";
import { grantRoleByEmail, StaffError } from "@/services/staff";

export const runtime = "nodejs";

// Grant a role to an existing user by email (admin-only).
export async function POST(req: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: "Зөвхөн админ эрх олгох боломжтой" },
      { status: 403 },
    );
  }
  try {
    const body = await req.json();
    const { email, role } = grantStaffSchema.parse(body);
    const admin = await grantRoleByEmail(email, role);
    return NextResponse.json({ admin }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Талбар буруу байна", issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    if (err instanceof StaffError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[api/admin/staff] grant failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
