// ──────────────────────────────────────────────────────────────
// Wire API client (server only).
//
// Wire is the payment aggregator in front of QPay. Our connection there is
// registered as `operator: "qpay", mode: "reseller"` — reseller mode means Wire
// settles under its own QPay merchant rights, so this app holds NO QPay
// username / password / invoice code. The only secret here is the Wire API key.
//
// Written against docs.wire.mn and verified against the live API. Wire is
// Stripe-shaped: `{object, data, has_more}` envelopes, `sk_live_`/`sk_test_`
// keys, nested `{error:{type,code,message,request_id}}` failures, and an
// `Idempotency-Key` header required on every mutating POST.
//
// Responses are still read through tolerant pick() helpers: `next_action` is
// undocumented (`{}` in the spec) and operator payloads pass through it, so an
// unexpected key degrades to `undefined` rather than throwing.
// ──────────────────────────────────────────────────────────────
import "server-only";
import { randomUUID } from "node:crypto";
import type { PaymentStatus } from "@/types";

const PATHS = {
  operatorConnections: "/v1/operator_connections",
  paymentIntents: "/v1/payment_intents",
  checkoutSessions: "/v1/checkout/sessions",
} as const;

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Origin only — the paths in PATHS already carry the `/v1` prefix.
 *
 * Read at call time, not module scope, because env is not populated during
 * build. A trailing `/v1` is stripped: Wire's docs quote full endpoint URLs, so
 * pasting `https://…/v1` is the obvious mistake and would produce `/v1/v1/…`.
 */
function baseUrl(): string {
  return (process.env.WIRE_API_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/v1$/i, "");
}

function apiKey(): string {
  return (process.env.WIRE_API_KEY ?? "").trim();
}

/** True once both the Wire base URL and API key are present. */
export function isWireConfigured(): boolean {
  return baseUrl().length > 0 && apiKey().length > 0;
}

export class WireError extends Error {
  readonly status: number;
  readonly code?: string;
  /** Wire's `request_id` — quote it when asking Wire support about a failure. */
  readonly requestId?: string;

  constructor(message: string, status = 0, code?: string, requestId?: string) {
    super(message);
    this.name = "WireError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

type Json = Record<string, unknown>;

function isJson(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** First defined value among `keys`, coerced to a non-empty string. */
function pickString(source: Json, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function pickNumber(source: Json, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function pickArray(source: Json, ...keys: string[]): unknown[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

/**
 * Unwrap the payload envelope. Wire answers with the resource directly, or
 * wrapped as `{ data: ... }` / `{ result: ... }`.
 *
 * Only those two keys, deliberately: a checkout session carries a real
 * `payment_intent` field, so treating that as an envelope would unwrap the
 * session down to the bare intent id string.
 */
function unwrap(payload: unknown): unknown {
  if (!isJson(payload)) return payload;
  for (const key of ["data", "result"]) {
    if (key in payload) return payload[key];
  }
  return payload;
}

function unwrapList(payload: unknown): Json[] {
  const body = unwrap(payload);
  const raw = Array.isArray(body)
    ? body
    : isJson(body)
      ? pickArray(body, "items", "connections", "operator_connections", "results")
      : [];
  return raw.filter(isJson);
}

async function wireFetch<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; idempotencyKey?: string } = {},
): Promise<T> {
  if (!isWireConfigured()) {
    throw new WireError(
      "Wire тохиргоо дутуу байна (WIRE_API_BASE_URL / WIRE_API_KEY).",
    );
  }

  const headers: Record<string, string> = {
    // Wire's docs don't spell the auth scheme out; bearer is the `/v1` REST
    // convention. If Wire expects something else, change it here only.
    Authorization: `Bearer ${apiKey()}`,
    Accept: "application/json",
  };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  // Wire rejects any non-GET without this header ("Idempotency-Key header is
  // required"). Callers that must be safe to retry — creating an invoice above
  // all — pass a stable key so a repeat never produces a second charge;
  // everything else gets a fresh one, which satisfies the API without pinning
  // an unrelated request to a cached result.
  const method = init.method ?? "GET";
  if (method !== "GET") {
    headers["Idempotency-Key"] = init.idempotencyKey ?? randomUUID();
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new WireError(`Wire-тэй холбогдож чадсангүй: ${reason}`);
  }

  const text = await res.text();
  let payload: unknown = undefined;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = undefined;
    }
  }

  if (!res.ok) {
    // Wire nests its errors: {"error":{"type","code","message","request_id"}}.
    // Confirmed against a live 401 from api.wire.mn. The flat lookups are kept
    // as a fallback for any endpoint that answers differently.
    const body = isJson(payload) ? payload : {};
    const nested = isJson(body.error) ? body.error : {};
    const message =
      pickString(nested, "message", "detail") ??
      pickString(body, "error", "message", "detail", "error_description") ??
      `Wire API алдаа (${res.status})`;
    throw new WireError(
      message,
      res.status,
      pickString(nested, "code", "type") ?? pickString(body, "code"),
      pickString(nested, "request_id") ?? pickString(body, "request_id"),
    );
  }

  return payload as T;
}

// ── Operator connections ──────────────────────────────────────

export interface WireOperatorConnection {
  id: string;
  /** e.g. "qpay" */
  operator: string;
  /** e.g. "reseller" | "byo" */
  mode: string;
  /** Wire's own status vocabulary — surfaced verbatim in the admin UI. */
  status: string;
}

function normalizeConnection(raw: Json): WireOperatorConnection | null {
  const id = pickString(raw, "id", "_id", "connection_id");
  const operator = pickString(raw, "operator", "operator_name");
  if (!id || !operator) return null;
  return {
    id,
    operator,
    mode: pickString(raw, "mode") ?? "unknown",
    status: pickString(raw, "status", "state") ?? "unknown",
  };
}

/** `GET /v1/operator_connections` — every connection on the Wire project. */
export async function listOperatorConnections(): Promise<
  WireOperatorConnection[]
> {
  const payload = await wireFetch(PATHS.operatorConnections);
  return unwrapList(payload)
    .map(normalizeConnection)
    .filter((c): c is WireOperatorConnection => c !== null);
}

/** The live QPay connection, or null while onboarding is still in progress. */
export async function getQpayConnection(): Promise<WireOperatorConnection | null> {
  const connections = await listOperatorConnections();
  return connections.find((c) => c.operator === QPAY_OPERATOR) ?? null;
}

export interface WireConnectionTest {
  ok: boolean;
  message?: string;
}

/** `POST /v1/operator_connections/{id}/test` — health check from the admin UI. */
export async function testOperatorConnection(
  id: string,
): Promise<WireConnectionTest> {
  const payload = await wireFetch(
    `${PATHS.operatorConnections}/${encodeURIComponent(id)}/test`,
    { method: "POST" },
  );
  const body = unwrap(payload);
  if (!isJson(body)) return { ok: true };
  const flag = body["ok"] ?? body["success"] ?? body["passed"];
  const status = pickString(body, "status", "result");
  const ok =
    typeof flag === "boolean"
      ? flag
      : status
        ? ["ok", "success", "passed", "healthy", "active"].includes(
            status.toLowerCase(),
          )
        : true;
  return { ok, message: pickString(body, "message", "detail", "error") };
}

// ── Payment intents ───────────────────────────────────────────

export const QPAY_OPERATOR = "qpay";

/** One bank app the customer can jump straight into (QPay's `urls`). */
export interface WireDeeplink {
  name: string;
  link: string;
  logo?: string;
}

export interface WireIntent {
  id: string;
  /** Normalized to our own vocabulary; null when Wire reports something we
   *  don't recognise, in which case the order is deliberately left untouched. */
  status: PaymentStatus | null;
  /** Wire's raw status string — logged and shown to admins for diagnosis. */
  rawStatus: string;
  operator?: string;
  amount?: number;
  /** QR payload as text (fallback when no image is supplied). */
  qrText?: string;
  /** Ready-to-render `<img src>` — data URI or absolute URL. */
  qrImage?: string;
  /** Wire-hosted checkout, if the intent exposes one. */
  checkoutUrl?: string;
  deeplinks: WireDeeplink[];
  expiresAt?: number;
}

const STATUS_MAP: Record<string, PaymentStatus> = {
  paid: "paid",
  succeeded: "paid",
  success: "paid",
  successful: "paid",
  completed: "paid",
  complete: "paid",
  settled: "paid",
  captured: "paid",
  pending: "pending",
  processing: "pending",
  created: "pending",
  new: "pending",
  open: "pending",
  in_progress: "pending",
  awaiting_payment: "pending",
  requires_payment: "pending",
  requires_payment_method: "pending",
  requires_action: "pending",
  unpaid: "pending",
  failed: "failed",
  failure: "failed",
  error: "failed",
  declined: "failed",
  rejected: "failed",
  canceled: "failed",
  cancelled: "failed",
  expired: "failed",
  timeout: "failed",
};

/**
 * Map a Wire status onto our four-state PaymentStatus. Unknown strings return
 * null on purpose: refunds, disputes and any status Wire adds later must not be
 * silently folded into "paid" or "failed".
 */
export function normalizeIntentStatus(raw: string | undefined): PaymentStatus | null {
  if (!raw) return null;
  return STATUS_MAP[raw.trim().toLowerCase()] ?? null;
}

/** Accept a data URI, an absolute URL, or bare base64 (QPay's `qr_image`). */
function normalizeQrImage(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("data:")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[A-Za-z0-9+/=\s]+$/.test(value) && value.length > 64) {
    return `data:image/png;base64,${value.replace(/\s+/g, "")}`;
  }
  return undefined;
}

function normalizeDeeplinks(source: Json): WireDeeplink[] {
  const raw = pickArray(source, "urls", "deeplinks", "deep_links", "links", "banks");
  const out: WireDeeplink[] = [];
  for (const entry of raw) {
    if (!isJson(entry)) continue;
    const link = pickString(entry, "link", "url", "deeplink", "href");
    if (!link) continue;
    out.push({
      name: pickString(entry, "name", "description", "bank", "title") ?? "Банк",
      link,
      logo: pickString(entry, "logo", "icon", "image"),
    });
  }
  return out;
}

function normalizeExpiry(source: Json): number | undefined {
  const value = pickString(source, "expires_at", "expiresAt", "expiry_date");
  if (!value) return undefined;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    // Seconds vs milliseconds — anything below year 2286 in ms is seconds.
    return asNumber < 1e12 ? asNumber * 1000 : asNumber;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function normalizeIntent(payload: unknown): WireIntent {
  const body = unwrap(payload);
  if (!isJson(body)) {
    throw new WireError("Wire-ээс уншиж болохгүй хариу ирлээ.");
  }
  const id = pickString(body, "id", "_id", "intent_id", "payment_intent_id");
  if (!id) {
    throw new WireError("Wire-ийн хариунд төлбөрийн ID алга байна.");
  }

  // QR fields may sit on the intent itself or on a nested operator payload.
  const nested = ["qpay", "operator_data", "operator_payload", "invoice", "qr"]
    .map((key) => body[key])
    .find(isJson);
  const qrSource: Json = nested ? { ...nested, ...body } : body;

  const rawStatus = pickString(body, "status", "state") ?? "";

  return {
    id,
    status: normalizeIntentStatus(rawStatus),
    rawStatus,
    operator: pickString(body, "selected_operator", "operator", "settled_operator"),
    amount: pickNumber(body, "amount", "total", "value"),
    qrText: pickString(qrSource, "qr_text", "qrText", "qr", "qr_code", "qPay_QRcode"),
    qrImage: normalizeQrImage(
      pickString(qrSource, "qr_image", "qrImage", "qr_image_url", "qr_png"),
    ),
    checkoutUrl: pickString(
      body,
      "checkout_url",
      "checkoutUrl",
      "payment_url",
      "hosted_url",
      "short_link",
    ),
    deeplinks: normalizeDeeplinks(qrSource),
    expiresAt: normalizeExpiry(body),
  };
}

export interface CreateIntentInput {
  /** Whole tögrög. Always build it with `toWireAmount()` — see the note there. */
  amount: number;
  description: string;
  /** Arbitrary key/values echoed back on the intent and its webhooks. */
  metadata?: Record<string, string>;
  /** Restrict settlement to these operators. Defaults to QPay only. */
  allowedOperators?: string[];
  /** Let Wire route to any live operator instead of a fixed list. */
  automaticOperator?: boolean;
  /** Safe retries — the same key must not create a second invoice. */
  idempotencyKey?: string;
}

/**
 * Tögrög → the value Wire's `amount` field expects. Currently 1:1.
 *
 * ⚠ Wire's docs claim minor units ("50000 гэдэг нь 500.00 ₮"), but the live
 * product disagrees: an intent created with `amount: 12345` renders as
 * "12,345₮" on pay.wire.mn and dispatches to QPay at that same figure. The
 * customer-facing page is what actually gets paid, so whole tögrög it is.
 *
 * This function exists so that discrepancy has exactly one home. If Wire
 * confirms the docs are right, change it here and nowhere else.
 */
export function toWireAmount(togrog: number): number {
  return Math.round(togrog);
}

/**
 * `POST /v1/payment_intents` with `allowed_operators: ["qpay"]`.
 *
 * The body carries only what the API documents: amount, currency, description,
 * operator routing and metadata. There is no `reference` field (use metadata)
 * and no per-intent `callback_url` — webhooks are delivered to endpoints
 * registered under `/v1/webhook_endpoints`.
 *
 * A fresh intent comes back as `requires_payment_method` and expires in ~10
 * minutes, so hand it to a checkout session straight away.
 */
export async function createPaymentIntent(
  input: CreateIntentInput,
): Promise<WireIntent> {
  const body: Json = {
    amount: input.amount,
    currency: "MNT",
    description: input.description,
  };
  if (input.automaticOperator) {
    body.automatic_operator = true;
  } else {
    body.allowed_operators = input.allowedOperators ?? [QPAY_OPERATOR];
  }
  if (input.metadata) body.metadata = input.metadata;

  const payload = await wireFetch(PATHS.paymentIntents, {
    method: "POST",
    body,
    idempotencyKey: input.idempotencyKey,
  });
  return normalizeIntent(payload);
}

export interface WireCheckoutSession {
  id: string;
  /** Wire-hosted page (pay.wire.mn) showing the QR and bank deeplinks. */
  url: string;
  paymentIntentId?: string;
}

/**
 * `POST /v1/checkout/sessions` — the supported way to actually collect a QPay
 * payment. Wire renders the QR and the bank deeplinks; we never see the raw QR.
 *
 * Only valid on an intent still in `requires_payment_method`: do not call
 * `/confirm` first, or this fails with `payment_intent_unexpected_state`.
 */
export async function createCheckoutSession(input: {
  paymentIntentId: string;
  successUrl?: string;
  cancelUrl?: string;
  idempotencyKey?: string;
}): Promise<WireCheckoutSession> {
  const body: Json = { payment_intent: input.paymentIntentId };
  if (input.successUrl) body.success_url = input.successUrl;
  if (input.cancelUrl) body.cancel_url = input.cancelUrl;

  const payload = await wireFetch(PATHS.checkoutSessions, {
    method: "POST",
    body,
    idempotencyKey: input.idempotencyKey,
  });
  const session = unwrap(payload);
  if (!isJson(session)) {
    throw new WireError("Wire-ээс уншиж болохгүй хариу ирлээ.");
  }
  const id = pickString(session, "id");
  const url = pickString(session, "url");
  if (!id || !url) {
    throw new WireError("Checkout session-ий хаяг ирсэнгүй.");
  }
  return {
    id,
    url,
    paymentIntentId: pickString(session, "payment_intent"),
  };
}

/** `GET /v1/payment_intents/{id}` — the authoritative payment state. */
export async function retrievePaymentIntent(id: string): Promise<WireIntent> {
  const payload = await wireFetch(
    `${PATHS.paymentIntents}/${encodeURIComponent(id)}`,
  );
  return normalizeIntent(payload);
}
