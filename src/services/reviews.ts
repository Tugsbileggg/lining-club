// Reviews service (server). Guests submit pending reviews; staff/admin moderate.
// All writes go through firebase-admin. Queries use single-field filters only
// (no composite index needed).
import "server-only";
import { revalidatePath } from "next/cache";
import type { Review, ReviewStatus } from "@/types";
import { adminDb } from "@/lib/firebase/admin";
import { getProductById } from "./products";
import type { ReviewInput } from "@/lib/validation/review";

const COLLECTION = "reviews";

/** Refresh the (SSG) product page so moderation changes show immediately. */
async function revalidateProduct(productId: string) {
  const product = await getProductById(productId).catch(() => null);
  if (product) revalidatePath(`/products/${product.handle}`);
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

/** Approved reviews for a product (storefront). Filters status in memory to
 * avoid a composite index on (productId, status). */
export async function getApprovedReviews(productId: string): Promise<Review[]> {
  const snap = await adminDb()
    .collection(COLLECTION)
    .where("productId", "==", productId)
    .get();
  return snap.docs
    .map((d) => d.data() as Review)
    .filter((r) => r.status === "approved")
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** All reviews (optionally filtered by status) for the admin queue. */
export async function listReviews(status?: ReviewStatus): Promise<Review[]> {
  const snap = await adminDb().collection(COLLECTION).get();
  let reviews = snap.docs.map((d) => d.data() as Review);
  if (status) reviews = reviews.filter((r) => r.status === status);
  return reviews.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createReview(input: ReviewInput): Promise<Review> {
  const ref = adminDb().collection(COLLECTION).doc();
  const review: Review = {
    id: ref.id,
    productId: input.productId,
    author: input.author.trim(),
    rating: input.rating as Review["rating"],
    title: input.title ? input.title.trim() : undefined,
    body: input.body.trim(),
    status: "pending",
    createdAt: Date.now(),
  };
  await ref.set(stripUndefined(review as unknown as Record<string, unknown>));
  return review;
}

export async function updateReviewStatus(
  id: string,
  status: ReviewStatus,
): Promise<Review> {
  const ref = adminDb().collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Сэтгэгдэл олдсонгүй");
  const review = doc.data() as Review;
  await ref.update({ status });
  await revalidateProduct(review.productId);
  return { ...review, status };
}

export async function deleteReview(id: string): Promise<void> {
  const ref = adminDb().collection(COLLECTION).doc(id);
  const doc = await ref.get();
  const review = doc.exists ? (doc.data() as Review) : null;
  await ref.delete();
  if (review) await revalidateProduct(review.productId);
}
