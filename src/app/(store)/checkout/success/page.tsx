import type { Metadata } from "next";
import { OrderConfirmation } from "./order-confirmation";

export const metadata: Metadata = { title: "Захиалга баталгаажлаа" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; paid?: string }>;
}) {
  const { order, paid } = await searchParams;
  return <OrderConfirmation orderNumber={order ?? "—"} paid={paid === "1"} />;
}
