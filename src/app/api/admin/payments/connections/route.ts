import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { getCurrentAdmin, isAdmin } from "@/lib/auth";
import {
  WireError,
  isWireConfigured,
  listOperatorConnections,
  testOperatorConnection,
} from "@/lib/payments/wire";
import { wireWebhookUrl } from "@/services/payment";

export const runtime = "nodejs";

// Admin-only, matching the settings route: payment wiring is critical config
// and staff must not be able to probe it.
async function guard() {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Зөвхөн админ хандах эрхтэй" }, { status: 403 });
  }
  return null;
}

function wireFailure(err: unknown, scope: string) {
  if (err instanceof WireError) {
    console.error(
      `[api/admin/payments] ${scope}: ${err.status} ${err.code ?? "-"} (request_id=${err.requestId ?? "-"}): ${err.message}`,
    );
    // Wire's own message is surfaced to the admin — it is the actionable part
    // ("missing api key", "connection not active"), and admins are trusted.
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
  console.error(`[api/admin/payments] ${scope}:`, err);
  return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
}

/** GET /v1/operator_connections, proxied for the admin settings card. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  // Surfaced regardless of config: it is what the admin must register under
  // /v1/webhook_endpoints, and Wire shows the whsec_ secret only once.
  const webhookUrl = wireWebhookUrl();

  if (!isWireConfigured()) {
    return NextResponse.json({ configured: false, connections: [], webhookUrl });
  }
  try {
    const connections = await listOperatorConnections();
    return NextResponse.json({ configured: true, connections, webhookUrl });
  } catch (err) {
    return wireFailure(err, "list failed");
  }
}

const testSchema = z.object({ id: z.string().min(1) });

/** POST /v1/operator_connections/{id}/test — the "Тест хийх" button. */
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const { id } = testSchema.parse(await req.json());
    const result = await testOperatorConnection(id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Хүсэлт буруу байна" }, { status: 422 });
    }
    return wireFailure(err, "test failed");
  }
}
