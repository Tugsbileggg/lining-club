import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentAdmin, isAdmin } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation/settings";
import { updateSettings } from "@/services/settings";

export const runtime = "nodejs";

// Settings are admin-only (staff must not change critical configuration),
// matching the Firestore rule for `settings/*`.
export async function PUT(req: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: "Зөвхөн админ өөрчлөх эрхтэй" },
      { status: 403 },
    );
  }
  try {
    const body = await req.json();
    const input = settingsSchema.parse(body);
    const settings = await updateSettings(input);
    return NextResponse.json({ settings });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Талбар буруу байна", issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    console.error("[api/admin/settings] update failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
