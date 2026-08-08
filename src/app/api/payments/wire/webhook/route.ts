import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getOrderByIntentId, getOrderByNumber } from "@/services/orders";
import { syncQpayPayment } from "@/services/payment";

export const runtime = "nodejs";

// ──────────────────────────────────────────────────────────────
// Wire payment callback.
//
// The body is treated purely as a *hint that something changed*: it tells us
// which order to look at, and nothing more. The status is then re-read from
// Wire's API inside syncQpayPayment. That means a forged or replayed callback
// can, at worst, cause one extra API lookup — it can never mark an order paid.
//
// This matches Wire's own advice ("Server талд давхар шалга: захиалга
// биелүүлэхээс өмнө PaymentIntent-ийн статусыг API-аар баталгаажуул").
//
// The signature check is still enforced whenever WIRE_WEBHOOK_SECRET holds the
// endpoint's `whsec_…`, which is returned exactly once when the endpoint is
// registered via POST /v1/webhook_endpoints.
// ──────────────────────────────────────────────────────────────

/** Wire's documented header: `WirePayment-Signature: t=<unix>,v1=<hex>`. */
const SIGNATURE_HEADER = "WirePayment-Signature";
/** Reject deliveries older than this, per Wire's own SDK default. */
const TOLERANCE_SECONDS = 300;

type SignatureCheck = { ok: true } | { ok: false; reason: string };

/**
 * v1 = HMAC-SHA256(endpoint secret, "<t>.<rawBody>"), hex.
 *
 * Verified against the raw body: parsing first would reorder or reformat bytes
 * and break the digest. The timestamp is part of the signed string, so an
 * attacker cannot replay an old delivery with a fresh `t`.
 */
function verifySignature(req: NextRequest, rawBody: string): SignatureCheck {
  const secret = process.env.WIRE_WEBHOOK_SECRET?.trim();
  if (!secret) return { ok: true };

  const header = req.headers.get(SIGNATURE_HEADER);
  if (!header) return { ok: false, reason: "signature header missing" };

  let timestamp: string | undefined;
  let provided: string | undefined;
  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key?.trim() === "t") timestamp = value?.trim();
    if (key?.trim() === "v1") provided = value?.trim();
  }
  if (!timestamp || !provided) {
    return { ok: false, reason: "malformed signature header" };
  }

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) {
    return { ok: false, reason: `timestamp outside tolerance (${Math.round(age)}s)` };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided.toLowerCase(), "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "digest mismatch" };
  }
  return { ok: true };
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function obj(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Locate the order in a Wire event: `{ id, type, data: { object: <intent> } }`.
 *
 * The intent carries no `reference` field, so `metadata.order_number` — set
 * when the intent was created — is the link back to our order. The intent id is
 * the fallback.
 */
function extractRefs(payload: unknown): {
  eventType?: string;
  orderNumber?: string;
  intentId?: string;
} {
  const body = obj(payload);
  const data = obj(body.data);
  // Accept the intent nested under data.object, or data itself.
  const intent = "object" in data && typeof data.object === "object"
    ? obj(data.object)
    : data;
  const metadata = obj(intent.metadata);

  return {
    eventType: str(body.type),
    orderNumber: str(metadata.order_number) ?? str(metadata.orderNumber),
    intentId: str(intent.id) ?? str(body.payment_intent),
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature = verifySignature(req, rawBody);
  if (!signature.ok) {
    console.warn(`[wire/webhook] rejected: ${signature.reason}`);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { eventType, orderNumber, intentId } = extractRefs(payload);
  if (!orderNumber && !intentId) {
    // 200, not 400: Wire pings this URL to verify the endpoint before enabling
    // it, and that probe carries no order of ours. Rejecting it would block
    // registration, and a retry could never help anyway.
    console.info(`[wire/webhook] no order reference in ${eventType ?? "event"} — acknowledged`);
    return NextResponse.json({ received: true, matched: false });
  }

  try {
    const order =
      (orderNumber ? await getOrderByNumber(orderNumber) : null) ??
      (intentId ? await getOrderByIntentId(intentId) : null);

    if (!order) {
      // 200 on purpose: the callback is well-formed, we simply have no such
      // order (verification ping, deleted order). Retrying would not help Wire.
      console.warn(
        `[wire/webhook] unknown order (order=${orderNumber ?? "-"} intent=${intentId ?? "-"})`,
      );
      return NextResponse.json({ received: true, matched: false });
    }

    const { order: synced } = await syncQpayPayment(order);
    console.info(
      `[wire/webhook] ${eventType ?? "event"} ${synced.orderNumber} → payment ${synced.payment.status}`,
    );
    return NextResponse.json({ received: true, status: synced.payment.status });
  } catch (err) {
    // 500 so Wire retries — the payment is real, our side just failed.
    console.error("[wire/webhook] sync failed:", err);
    return NextResponse.json({ error: "sync failed" }, { status: 500 });
  }
}
