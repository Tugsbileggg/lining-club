import type { Metadata } from "next";
import { getOrderByNumber } from "@/services/orders";
import { OrderConfirmation } from "./order-confirmation";

export const metadata: Metadata = { title: "Захиалга баталгаажлаа" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; paid?: string }>;
}) {
  const { order, paid } = await searchParams;

  // Look the order up server-side rather than trusting the client summary in
  // sessionStorage: a buyer paying by bank transfer needs the account details
  // here, and that summary is gone the moment they close the tab. Failure is
  // never fatal — the page still renders everything else.
  let bankDue: number | null = null;
  if (order) {
    try {
      const found = await getOrderByNumber(order);
      if (found?.payment.provider === "manual") bankDue = found.total;
    } catch (err) {
      console.error("[checkout/success] order lookup failed:", err);
    }
  }

  return (
    <OrderConfirmation
      orderNumber={order ?? "—"}
      paid={paid === "1"}
      bankDue={bankDue}
    />
  );
}
