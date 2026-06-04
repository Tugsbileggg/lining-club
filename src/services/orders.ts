// Orders service (server). Creates guest orders, lists/looks them up, and
// mutates status for the admin console. All writes go through firebase-admin
// (bypasses Firestore rules); the public client never touches the collection.
import "server-only";
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
    // QPay isn't wired yet → invoice pending; manual (bank/cash) → unpaid
    // until staff confirm receipt.
    status: input.paymentMethod === "qpay" ? "pending" : "unpaid",
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
