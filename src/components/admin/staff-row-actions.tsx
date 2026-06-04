"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminRole } from "@/types";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "rounded-md border bg-background px-2.5 py-1.5 text-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  "disabled:opacity-50",
);

export function StaffRowActions({
  uid,
  role,
  isSelf,
}: {
  uid: string;
  role: AdminRole;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // The signed-in admin cannot change or remove their own access (lockout guard).
  if (isSelf) {
    return <span className="text-xs text-muted-foreground">Таны бүртгэл</span>;
  }

  async function onRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as AdminRole;
    if (next === role) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/staff/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Алдаа гарлаа");
      toast.success("Эрх шинэчлэгдлээ. Хэрэглэгч дахин нэвтрэх шаардлагатай.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke() {
    if (!confirm("Энэ хэрэглэгчийн эрхийг хураах уу?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/staff/${uid}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Алдаа гарлаа");
      toast.success("Эрх хураагдлаа");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        value={role}
        onChange={onRoleChange}
        disabled={busy}
        className={selectClass}
        aria-label="Эрх"
      >
        <option value="staff">Ажилтан</option>
        <option value="admin">Админ</option>
      </select>
      <button
        onClick={onRevoke}
        disabled={busy}
        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive disabled:opacity-50"
        aria-label="Эрх хураах"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
