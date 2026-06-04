import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { heroSchema } from "@/lib/validation/content";
import { updateHero } from "@/services/content";

export const runtime = "nodejs";

// Content is editable by staff or admin (matches the `content/*` Firestore rule).
export async function PUT(req: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const input = heroSchema.parse(body);
    const hero = await updateHero(input);
    return NextResponse.json({ hero });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Талбар буруу байна", issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    console.error("[api/admin/content/hero] update failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
