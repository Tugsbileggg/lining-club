"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

// Admin-only. Deletes the order then returns to the list.
export function OrderDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("Энэ захиалгыг устгах уу? Энэ үйлдлийг буцаах боломжгүй.")) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Устгахад алдаа гарлаа");
      }
      toast.success("Захиалга устгагдлаа");
      router.push("/admin/orders");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      <Trash2 className="size-4" />
      Устгах
    </button>
  );
}
