// Orders service (server). Creates guest orders, lists/looks them up, and
// mutates status for the admin console. All writes go through firebase-admin
// (bypasses Firestore rules); the public client never touches the collection.
import "server-only";
import { randomUUID, timingSafeEqual } from "node:crypto";
import type {
  Order,
  OrderCustomer,
  OrderItem,
  OrderPayment,
  OrderStatus,
  PaymentStatus,
} from "@/types";
import { adminDb } from "@/lib/firebase/admin";
import { generateOrderNumber } from "@/lib/order-number";
import { getProductById } from "./products";
import type { CustomerInput } from "@/lib/validation/checkout";
import type { OrderInput } from "@/lib/validation/order";

const COLLECTION = "orders";

// TODO(backend): real shipping calculation. Currently pay-on-delivery, so the
// order carries no shipping fee and total === subtotal.
const SHIPPING_FEE = 0;

/** Thrown for caller-fixable problems (missing product, unavailable variant). */
export class OrderError extends Error {}

/**
 * Firestore (admin SDK) rejects `undefined` field values. Order items and
 * customers carry optional fields (size/color/email/note) that may be absent,
 * so drop undefined keys before writing. `null` is preserved.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

function cleanCustomer(c: CustomerInput): OrderCustomer {
  return {
    name: c.name.trim(),
    phone: c.phone.trim(),
    email: c.email ? c.email.trim() : undefined,
    address: c.address.trim(),
    city: c.city ? c.city.trim() : undefined,
    note: c.note ? c.note.trim() : undefined,
  };
}

export async function createOrder(input: OrderInput): Promise<Order> {
  // Re-derive every line from the live catalog — never trust client prices.
  const items: OrderItem[] = [];
  let subtotal = 0;

  for (const line of input.items) {
    const product = await getProductById(line.productId);
    if (!product || product.status === "archived") {
      throw new OrderError("Захиалгын бараа олдсонгүй эсвэл идэвхгүй байна.");
    }
    const variant = product.variants.find((v) => v.id === line.variantId);
    if (!variant || !variant.available) {
      throw new OrderError(`Сонгосон хувилбар боломжгүй байна: ${product.title}`);
    }
    items.push({
      productId: product.id,
      handle: product.handle,
      title: product.title,
      variantId: variant.id,
      size: variant.size,
      color: variant.color,
      image: product.images[0]?.url ?? "",
      price: variant.price,
      quantity: line.quantity,
    });
    subtotal += variant.price * line.quantity;
  }

  const shipping = SHIPPING_FEE;
  const now = Date.now();
  const payment: OrderPayment = {
    provider: input.paymentMethod,
    // QPay → awaiting the customer to scan the QR; manual (bank/cash) → unpaid
    // until staff confirm receipt.
    status: input.paymentMethod === "qpay" ? "pending" : "unpaid",
    // Gate for the public QR/status endpoints (QPay only — nothing to guard on
    // a manual order).
    token: input.paymentMethod === "qpay" ? randomUUID() : undefined,
    paidAt: null,
  };

  const ref = adminDb().collection(COLLECTION).doc();
  const order: Order = {
    id: ref.id,
    orderNumber: generateOrderNumber(),
    status: "pending",
    customer: cleanCustomer(input.customer),
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    payment,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(stripUndefined(order));
  return order;
}

/** All orders, newest first — for the admin list. */
export async function listOrders(): Promise<Order[]> {
  const snap = await adminDb().collection(COLLECTION).get();
  return snap.docs
    .map((d) => d.data() as Order)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const doc = await adminDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? (doc.data() as Order) : null;
}

/** Public order tracking lookup by human-friendly order number. */
export async function getOrderByNumber(
  orderNumber: string,
): Promise<Order | null> {
  const snap = await adminDb()
    .collection(COLLECTION)
    .where("orderNumber", "==", orderNumber)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  return doc ? (doc.data() as Order) : null;
}

/** Reverse lookup used by the Wire webhook when it reports only an intent id. */
export async function getOrderByIntentId(
  intentId: string,
): Promise<Order | null> {
  const snap = await adminDb()
    .collection(COLLECTION)
    .where("payment.intentId", "==", intentId)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  return doc ? (doc.data() as Order) : null;
}

/** Constant-time comparison of the buyer's payment token. */
export function verifyPaymentToken(
  order: Order,
  token: string | null | undefined,
): boolean {
  const expected = order.payment.token;
  if (!expected || !token) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(token, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Order lookup for the public payment endpoints. Returns null both for an
 * unknown order number and for a bad token, so a caller cannot use the
 * response to discover which order numbers exist.
 */
export async function getOrderForPayment(
  orderNumber: string,
  token: string | null | undefined,
): Promise<Order | null> {
  const order = await getOrderByNumber(orderNumber);
  if (!order || !verifyPaymentToken(order, token)) return null;
  return order;
}

export interface OrderPatch {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export async function updateOrder(
  id: string,
  patch: OrderPatch,
): Promise<Order> {
  const ref = adminDb().collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new OrderError("Захиалга олдсонгүй.");
  const current = doc.data() as Order;

  const now = Date.now();
  const update: Record<string, unknown> = { updatedAt: now };
  if (patch.status) update.status = patch.status;

  let payment = current.payment;
  if (patch.paymentStatus) {
    const paidAt = patch.paymentStatus === "paid" ? now : null;
    // Dot-path updates only touch the nested payment fields.
    update["payment.status"] = patch.paymentStatus;
    update["payment.paidAt"] = paidAt;
    payment = { ...current.payment, status: patch.paymentStatus, paidAt };
  }

  await ref.update(update);
  return {
    ...current,
    status: patch.status ?? current.status,
    payment,
    updatedAt: now,
  };
}

export async function deleteOrder(id: string): Promise<void> {
  await adminDb().collection(COLLECTION).doc(id).delete();
}

// ── Payment provider hooks ────────────────────────────────────

/** Remember which Wire PaymentIntent belongs to this order. */
export async function attachPaymentIntent(
  id: string,
  intentId: string,
): Promise<void> {
  await adminDb().collection(COLLECTION).doc(id).update({
    "payment.intentId": intentId,
    updatedAt: Date.now(),
  });
}

export interface PaymentResult {
  status: PaymentStatus;
  /** Wire's raw status string, stored for diagnosis. */
  providerStatus?: string;
  operator?: string;
}

/**
 * Record a payment outcome reported by the provider.
 *
 * Idempotent by design: the webhook and the customer's polling both land here,
 * often at the same moment. A paid order is never rewritten — `paidAt` must
 * stay the first settlement time, and re-writing would re-trigger any
 * downstream side effects. Returns the (possibly unchanged) order.
 */
export async function applyPaymentResult(
  id: string,
  result: PaymentResult,
): Promise<{ order: Order; changed: boolean }> {
  const ref = adminDb().collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new OrderError("Захиалга олдсонгүй.");
  const current = doc.data() as Order;

  if (current.payment.status === "paid") {
    return { order: current, changed: false };
  }
  if (current.payment.status === result.status && !result.providerStatus) {
    return { order: current, changed: false };
  }

  const now = Date.now();
  const paidAt = result.status === "paid" ? now : (current.payment.paidAt ?? null);
  const update: Record<string, unknown> = {
    updatedAt: now,
    "payment.status": result.status,
    "payment.paidAt": paidAt,
  };
  if (result.providerStatus) update["payment.providerStatus"] = result.providerStatus;
  if (result.operator) update["payment.operator"] = result.operator;

  await ref.update(update);
  return {
    order: {
      ...current,
      payment: {
        ...current.payment,
        status: result.status,
        paidAt,
        providerStatus: result.providerStatus ?? current.payment.providerStatus,
        operator: result.operator ?? current.payment.operator,
      },
      updatedAt: now,
    },
    changed: true,
  };
}
