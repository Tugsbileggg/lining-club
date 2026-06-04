import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { productInputSchema } from "@/lib/validation/product";
import { createProduct } from "@/services/products";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const input = productInputSchema.parse(body);
    const product = await createProduct(input);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Талбар буруу", issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    console.error("[api/products] create failed:", err);
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
