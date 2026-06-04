"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Хүлээгдэж буй" },
  { value: "accepted", label: "Баталгаажсан" },
  { value: "fulfilled", label: "Хүргэгдсэн" },
  { value: "cancelled", label: "Цуцлагдсан" },
];

export function OrderStatusSelect({
  id,
  value,
}: {
  id: string;
  value: OrderStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as OrderStatus;
    if (status === value) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Шинэчлэхэд алдаа гарлаа");
      }
      toast.success("Төлөв шинэчлэгдлээ");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={busy}
      className={cn(
        "rounded-md border bg-background px-2.5 py-1.5 text-sm",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:opacity-50",
      )}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
