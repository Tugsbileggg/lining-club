import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { reviewInputSchema } from "@/lib/validation/review";
import { createReview } from "@/services/reviews";

export const runtime = "nodejs";

// Public review submission. Always created as "pending" (server-enforced) and
// shown only after staff/admin approval.
// TODO(backend): basic rate limiting / spam protection.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = reviewInputSchema.parse(body);
    const review = await createReview(input);
    return NextResponse.json(
      { review: { id: review.id, status: review.status } },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Талбар буруу байна", issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    console.error("[api/reviews] create failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
