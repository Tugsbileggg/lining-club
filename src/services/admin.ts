import "server-only";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { getAllProducts, getCollections } from "./catalog";

export interface AdminStats {
  products: number;
  collections: number;
  orders: number;
  pendingOrders: number;
  pendingReviews: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [products, collections] = await Promise.all([
    getAllProducts(),
    getCollections(),
  ]);

  let orders = 0;
  let pendingOrders = 0;
  let pendingReviews = 0;

  if (isAdminConfigured()) {
    try {
      const [o, po, pr] = await Promise.all([
        adminDb().collection("orders").count().get(),
        adminDb().collection("orders").where("status", "==", "pending").count().get(),
        adminDb().collection("reviews").where("status", "==", "pending").count().get(),
      ]);
      orders = o.data().count;
      pendingOrders = po.data().count;
      pendingReviews = pr.data().count;
    } catch (err) {
      console.error("[admin] stats read failed:", err);
    }
  }

  return {
    products: products.length,
    collections: collections.length,
    orders,
    pendingOrders,
    pendingReviews,
  };
}
