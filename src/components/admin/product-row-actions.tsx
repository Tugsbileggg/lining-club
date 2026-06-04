"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ProductRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("Энэ барааг устгах уу?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Устгахад алдаа гарлаа");
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
      <Link
        href={`/admin/products/${id}`}
        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Засах"
      >
        <Pencil className="size-4" />
      </Link>
      <button
        onClick={onDelete}
        disabled={busy}
        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive disabled:opacity-50"
        aria-label="Устгах"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
