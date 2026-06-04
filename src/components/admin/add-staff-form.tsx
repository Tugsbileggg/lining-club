"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { AdminRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "rounded-md border bg-background px-2.5 py-2 text-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

export function AddStaffForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("staff");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Эрх олгоход алдаа гарлаа");
      toast.success("Эрх олголоо. Хэрэглэгч дахин нэвтрэх шаардлагатай.");
      setEmail("");
      setRole("staff");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-end"
    >
      <label className="flex-1">
        <span className="mb-1.5 block text-sm font-medium">
          Хэрэглэгчийн и-мэйл
        </span>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />
      </label>
      <label>
        <span className="mb-1.5 block text-sm font-medium">Эрх</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole)}
          className={selectClass}
        >
          <option value="staff">Ажилтан</option>
          <option value="admin">Админ</option>
        </select>
      </label>
      <Button type="submit" disabled={busy} className="gap-2">
        <UserPlus className="size-4" />
        {busy ? "Олгож байна..." : "Эрх олгох"}
      </Button>
    </form>
  );
}
