import Link from "next/link";
import { listOrders } from "@/services/orders";
import { formatPrice, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import type { OrderStatus, PaymentStatus } from "@/types";

export const dynamic = "force-dynamic";

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Төлөгдөөгүй",
  pending: "Хүлээгдэж буй",
  paid: "Төлсөн",
  failed: "Амжилтгүй",
};

const PAYMENT_VARIANT: Record<PaymentStatus, "secondary" | "outline"> = {
  unpaid: "outline",
  pending: "outline",
  paid: "secondary",
  failed: "outline",
};

function itemCount(items: { quantity: number }[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export default async function AdminOrdersPage() {
  const orders = await listOrders().catch(() => []);
  const pending = orders.filter((o) => o.status === "pending").length;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Захиалга</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} захиалга
          {pending > 0 ? ` · ${pending} шинэ` : ""}
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Дугаар</th>
              <th className="px-4 py-3 font-medium">Хүлээн авагч</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Бараа</th>
              <th className="px-4 py-3 font-medium">Дүн</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Төлбөр</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Огноо</th>
              <th className="px-4 py-3 font-medium">Төлөв</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => (
              <tr key={o.id} className="align-top hover:bg-accent/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-medium hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{o.customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {o.customer.phone}
                    </span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {itemCount(o.items)} ш
                </td>
                <td className="px-4 py-3">{formatPrice(o.total)}</td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Badge variant={PAYMENT_VARIANT[o.payment.status]}>
                    {PAYMENT_LABEL[o.payment.status]}
                  </Badge>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground lg:table-cell">
                  {formatDate(o.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusSelect
                    id={o.id}
                    value={o.status as OrderStatus}
                  />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Одоогоор захиалга алга.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
