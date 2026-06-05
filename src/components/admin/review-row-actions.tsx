"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Undo2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ReviewStatus } from "@/types";
import { cn } from "@/lib/utils";

const btn =
  "grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent disabled:opacity-50";

export function ReviewRowActions({
  id,
  status,
}: {
  id: string;
  status: ReviewStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function moderate(next: ReviewStatus) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Алдаа гарлаа");
      }
      toast.success("Шинэчлэгдлээ");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Энэ сэтгэгдлийг бүрмөсөн устгах уу?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Устгахад алдаа гарлаа");
      }
      toast.success("Устгагдлаа");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {status !== "approved" && (
        <button
          onClick={() => moderate("approved")}
          disabled={busy}
          className={cn(btn, "hover:text-green-600")}
          aria-label="Зөвшөөрөх"
          title="Зөвшөөрөх"
        >
          <Check className="size-4" />
        </button>
      )}
      {status !== "rejected" && (
        <button
          onClick={() => moderate("rejected")}
          disabled={busy}
          className={cn(btn, "hover:text-destructive")}
          aria-label="Татгалзах"
          title="Татгалзах"
        >
          <X className="size-4" />
        </button>
      )}
      {status !== "pending" && (
        <button
          onClick={() => moderate("pending")}
          disabled={busy}
          className={cn(btn, "hover:text-foreground")}
          aria-label="Хүлээгдэж буй болгох"
          title="Буцаах"
        >
          <Undo2 className="size-4" />
        </button>
      )}
      <button
        onClick={remove}
        disabled={busy}
        className={cn(btn, "hover:text-destructive")}
        aria-label="Устгах"
        title="Устгах"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
