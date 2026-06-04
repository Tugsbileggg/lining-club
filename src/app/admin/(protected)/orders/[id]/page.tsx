import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrderById } from "@/services/orders";
import { getCurrentAdmin, isAdmin } from "@/lib/auth";
import { formatPrice, formatDate } from "@/lib/format";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { PaymentStatusSelect } from "@/components/admin/payment-status-select";
import { OrderDeleteButton } from "@/components/admin/order-delete-button";
import type { OrderStatus, PaymentStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Хүлээгдэж буй",
  accepted: "Баталгаажсан",
  fulfilled: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Төлөгдөөгүй",
  pending: "Хүлээгдэж буй",
  paid: "Төлсөн",
  failed: "Амжилтгүй",
};

const PROVIDER_LABEL: Record<string, string> = {
  qpay: "QPay",
  manual: "Дансаар / Бэлэн",
};

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, user] = await Promise.all([getOrderById(id), getCurrentAdmin()]);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Захиалгууд руу буцах
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(order.createdAt)} · {STATUS_LABEL[order.status]}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-muted-foreground">Захиалгын төлөв</span>
          <OrderStatusSelect id={order.id} value={order.status} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items + totals */}
        <section className="rounded-xl border bg-background">
          <h2 className="border-b px-5 py-3 text-sm font-semibold">
            Бараа ({order.items.length})
          </h2>
          <ul className="divide-y">
            {order.items.map((item, idx) => (
              <li key={`${item.variantId}-${idx}`} className="flex gap-3 px-5 py-4">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/products/${item.handle}`}
                    className="line-clamp-1 text-sm font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {[item.size && `Хэмжээ ${item.size}`, item.color]
                      .filter(Boolean)
                      .join(" · ")}
                    {item.size || item.color ? " · " : ""}
                    {formatPrice(item.price)} × {item.quantity}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-medium">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t px-5 py-4">
            <Row label="Дэд дүн" value={formatPrice(order.subtotal)} />
            <Row
              label="Хүргэлт"
              value={order.shipping ? formatPrice(order.shipping) : "Үнэгүй / тооцно"}
            />
            <div className="flex justify-between gap-4 border-t pt-3 text-base font-semibold">
              <span>Нийт</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>

        {/* Customer + payment */}
        <div className="space-y-6">
          <section className="rounded-xl border bg-background p-5">
            <h2 className="text-sm font-semibold">Хүлээн авагч</h2>
            <div className="mt-2">
              <Row label="Нэр" value={order.customer.name} />
              <Row
                label="Утас"
                value={
                  <a href={`tel:${order.customer.phone}`} className="hover:underline">
                    {order.customer.phone}
                  </a>
                }
              />
              <Row label="И-мэйл" value={order.customer.email} />
              <Row label="Хот / Аймаг" value={order.customer.city} />
              <Row label="Хаяг" value={order.customer.address} />
              <Row label="Тэмдэглэл" value={order.customer.note} />
            </div>
          </section>

          <section className="rounded-xl border bg-background p-5">
            <h2 className="text-sm font-semibold">Төлбөр</h2>
            <div className="mt-2">
              <Row
                label="Хэлбэр"
                value={PROVIDER_LABEL[order.payment.provider] ?? order.payment.provider}
              />
              <Row
                label="Одоогийн төлөв"
                value={PAYMENT_LABEL[order.payment.status]}
              />
              {order.payment.paidAt && (
                <Row label="Төлсөн огноо" value={formatDate(order.payment.paidAt)} />
              )}
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Төлбөрийн төлөв өөрчлөх
              </span>
              <PaymentStatusSelect id={order.id} value={order.payment.status} />
            </div>
          </section>
        </div>
      </div>

      {isAdmin(user) && (
        <div className="mt-8 flex justify-end border-t pt-6">
          <OrderDeleteButton id={order.id} />
        </div>
      )}
    </div>
  );
}
