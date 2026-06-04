import Link from "next/link";
import { Package, ShoppingCart, Star, Boxes } from "lucide-react";
import { getAdminStats } from "@/services/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Бараа", value: stats.products, href: "/admin/products", icon: Package },
    { label: "Ангилал", value: stats.collections, href: "/admin/products", icon: Boxes },
    { label: "Захиалга", value: stats.orders, sub: `${stats.pendingOrders} хүлээгдэж буй`, href: "/admin/orders", icon: ShoppingCart },
    { label: "Сэтгэгдэл", value: stats.pendingReviews, sub: "шалгах хүлээж буй", href: "/admin/reviews", icon: Star },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Хяналтын самбар</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Lining Club дэлгүүрийн ерөнхий байдал.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-xl border bg-background p-5 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{c.value}</p>
              {c.sub && (
                <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border bg-background p-6">
        <h2 className="text-base font-semibold">Хурдан үйлдэл</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Шинэ бараа
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Захиалга харах
          </Link>
        </div>
      </div>
    </div>
  );
}
