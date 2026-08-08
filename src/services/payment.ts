// Payment orchestration (server). Bridges our orders to Wire.
//
// Wire holds the QPay connection in reseller mode, so this app never touches
// QPay merchant credentials. The collection flow is Wire's documented hosted
// checkout:
//
//   1. create a PaymentIntent (amount in MNT minor units, QPay-only)
//   2. open a checkout session on it → a pay.wire.mn URL
//   3. send the buyer there; Wire renders the QR and bank deeplinks
//   4. confirm server-side from the webhook / a status re-read
//
// `/v1/payment_intents/{id}/confirm` is deliberately NOT called: a confirmed
// intent can no longer take a checkout session.
//
// Amounts are never taken from the client — always `order.total`, which
// createOrder derives from the live catalog.
import "server-only";
import type { Order, PaymentStatus } from "@/types";
import { siteConfig } from "@/config/site";
import {
  QPAY_OPERATOR,
  WireError,
  createCheckoutSession,
  createPaymentIntent,
  isWireConfigured,
  retrievePaymentIntent,
  toWireAmount,
  type WireIntent,
} from "@/lib/payments/wire";
import { applyPaymentResult, attachPaymentIntent } from "./orders";

/** Caller-fixable payment problems (wrong provider, already paid, no config). */
export class PaymentError extends Error {}

/** QPay checkout is offered only when Wire credentials are present. */
export function isQpayEnabled(): boolean {
  return isWireConfigured();
}

/**
 * The URL to register as a Wire webhook endpoint (`POST /v1/webhook_endpoints`,
 * enabled event `payment_intent.succeeded`). Wire has no per-intent callback
 * field — delivery targets are registered once per project — so this is shown
 * in the admin settings card rather than sent with each payment.
 *
 * Override with WIRE_WEBHOOK_URL when developing behind a tunnel; Wire cannot
 * reach localhost.
 */
export function wireWebhookUrl(): string {
  const override = process.env.WIRE_WEBHOOK_URL?.trim();
  if (override) return override;
  return `${siteConfig.url.replace(/\/+$/, "")}/api/payments/wire/webhook`;
}

/**
 * Where Wire returns the buyer. Wire requires absolute HTTPS, so on a plain
 * http://localhost dev server we omit them and let Wire show its own result
 * page rather than have the session rejected.
 */
function returnUrls(orderNumber: string): { successUrl?: string; cancelUrl?: string } {
  const base = siteConfig.url.replace(/\/+$/, "");
  if (!base.startsWith("https://")) return {};
  // `return=1` tells the pay page it is a comeback, so it verifies the payment
  // instead of opening another checkout session and bouncing the buyer out.
  const url = `${base}/checkout/pay/${encodeURIComponent(orderNumber)}?return=1`;
  return { successUrl: url, cancelUrl: url };
}

export interface QpayCheckout {
  status: PaymentStatus;
  /** pay.wire.mn URL to send the buyer to; absent once the order is paid. */
  url?: string;
}

async function openSession(order: Order, intentId: string): Promise<string> {
  const { successUrl, cancelUrl } = returnUrls(order.orderNumber);
  const session = await createCheckoutSession({
    paymentIntentId: intentId,
    successUrl,
    cancelUrl,
    // Keyed to the intent: a refresh or a double tap reuses the same session
    // rather than opening a second one.
    idempotencyKey: `sess:${intentId}`,
  });
  return session.url;
}

/**
 * Get the hosted checkout URL for an order, creating the intent on first call.
 *
 * Re-entrant on purpose: an existing intent is reused whenever Wire will still
 * open a session on it. Intents expire in ~10 minutes and are then auto
 * cancelled, so a stale one falls through to a fresh intent rather than
 * stranding the buyer.
 */
export async function startQpayCheckout(order: Order): Promise<QpayCheckout> {
  if (!isQpayEnabled()) {
    throw new PaymentError("QPay холболт тохируулагдаагүй байна.");
  }
  if (order.payment.provider !== "qpay") {
    throw new PaymentError("Энэ захиалга QPay-ээр төлөгдөхөөр биш байна.");
  }
  if (order.payment.status === "paid") {
    throw new PaymentError("Энэ захиалга аль хэдийн төлөгдсөн байна.");
  }

  const existingId = order.payment.intentId;
  if (existingId) {
    try {
      const existing = await retrievePaymentIntent(existingId);
      if (existing.status === "paid") {
        await applyPaymentResult(order.id, {
          status: "paid",
          providerStatus: existing.rawStatus,
          operator: existing.operator ?? QPAY_OPERATOR,
        });
        return { status: "paid" };
      }
      if (existing.status === "pending") {
        return { status: "pending", url: await openSession(order, existingId) };
      }
    } catch (err) {
      // Expired, cancelled or already confirmed — none of which can take a new
      // session. Fall through and mint a fresh intent.
      console.warn(
        `[payment] reusing intent ${existingId} failed, creating a new one:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  const intent = await createPaymentIntent({
    // Whole tögrög — verified against pay.wire.mn, which bills exactly the
    // figure sent here. See toWireAmount() for why the docs say otherwise.
    amount: toWireAmount(order.total),
    description: `${siteConfig.name} — ${order.orderNumber}`,
    allowedOperators: [QPAY_OPERATOR],
    // There is no `reference` field; metadata is how the order travels with
    // the intent and comes back on the webhook.
    metadata: { order_id: order.id, order_number: order.orderNumber },
    idempotencyKey: existingId ? `${order.id}:${Date.now()}` : order.id,
  });

  await attachPaymentIntent(order.id, intent.id);
  // A previous invoice expiring fires payment_intent.canceled, which lands the
  // order on "failed". Once the buyer retries there is a live invoice again, so
  // move it back to pending — otherwise the admin list shows "Амжилтгүй" while
  // the customer is mid-payment.
  if (order.payment.status === "failed") {
    await applyPaymentResult(order.id, { status: "pending" });
  }
  return { status: "pending", url: await openSession(order, intent.id) };
}

export interface PaymentSync {
  order: Order;
  intent: WireIntent | null;
}

/**
 * Ask Wire for the current state of an order's intent and mirror it onto the
 * order. This is the ONLY path that marks an order paid — the webhook and the
 * post-checkout redirect merely trigger it, so neither a forged callback nor a
 * hand-typed success URL can move money on paper.
 */
export async function syncQpayPayment(order: Order): Promise<PaymentSync> {
  if (order.payment.status === "paid") return { order, intent: null };

  const intentId = order.payment.intentId;
  if (!intentId || !isQpayEnabled()) return { order, intent: null };

  let intent: WireIntent;
  try {
    intent = await retrievePaymentIntent(intentId);
  } catch (err) {
    // Never fail a status poll because Wire had a bad moment — the caller
    // simply keeps showing the last known state and polls again.
    console.error(
      "[payment] intent lookup failed:",
      err instanceof WireError
        ? `${err.status} ${err.message} (request_id=${err.requestId ?? "-"})`
        : err,
    );
    return { order, intent: null };
  }

  if (!intent.status) {
    console.warn(
      `[payment] unmapped Wire status "${intent.rawStatus}" on intent ${intent.id} — order left unchanged`,
    );
    return { order, intent };
  }

  const { order: updated } = await applyPaymentResult(order.id, {
    status: intent.status,
    providerStatus: intent.rawStatus,
    operator: intent.operator ?? QPAY_OPERATOR,
  });
  return { order: updated, intent };
}
