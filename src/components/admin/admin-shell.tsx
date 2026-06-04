"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Star,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  ExternalLink,
} from "lucide-react";
import type { AdminRole } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Package;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { label: "Хяналтын самбар", href: "/admin", icon: LayoutDashboard },
  { label: "Бараа", href: "/admin/products", icon: Package },
  { label: "Захиалга", href: "/admin/orders", icon: ShoppingCart },
  { label: "Сэтгэгдэл", href: "/admin/reviews", icon: Star },
  { label: "Контент", href: "/admin/content", icon: FileText },
  { label: "Ажилтан", href: "/admin/staff", icon: Users, adminOnly: true },
  { label: "Тохиргоо", href: "/admin/settings", icon: Settings, adminOnly: true },
];

export function AdminShell({
  user,
  children,
}: {
  user: { email: string; role: AdminRole };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => !n.adminOnly || user.role === "admin");

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Link href="/admin" className="text-base font-semibold uppercase tracking-tight">
          Lining Club
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">Админ самбар</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <div className="px-2 pb-2">
          <p className="truncate text-sm font-medium">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            {user.role === "admin" ? "Админ" : "Ажилтан"}
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="size-4" />
          Дэлгүүр харах
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="size-4" />
          Гарах
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-secondary/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r bg-background lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Цэс">
          <Menu className="size-5" />
        </Button>
        <span className="font-semibold uppercase tracking-tight">Lining Club</span>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-background shadow-xl">
            {sidebar}
          </div>
        </div>
      )}

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl p-5 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
