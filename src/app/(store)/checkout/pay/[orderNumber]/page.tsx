import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isQpayEnabled } from "@/services/payment";
import { QpayPanel } from "./qpay-panel";

export const metadata: Metadata = { title: "Төлбөр төлөх" };

// No order data is fetched here: the payment token lives in the buyer's
// sessionStorage, so the panel loads the invoice client-side once it has it.
export const dynamic = "force-dynamic";

export default async function PayPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  if (!isQpayEnabled()) notFound();
  return <QpayPanel orderNumber={decodeURIComponent(orderNumber)} />;
}
