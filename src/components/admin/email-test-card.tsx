"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Config {
  provider: string;
  /** True only when mail can actually be delivered. */
  delivers: boolean;
  from: string;
  notifyTo: string[];
  adminEmail: string;
}

/**
 * Shows where new-order notifications go and sends a sample one on demand.
 *
 * The provider is surfaced because "console" silently succeeds: without it, a
 * store that delivers nothing looks exactly like one that works.
 */
export function EmailTestCard() {
  const [config, setConfig] = useState<Config | null>(null);
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/email/test");
      if (!res.ok) return;
      const data = (await res.json()) as Config;
      setConfig(data);
      setTo((current) => current || data.adminEmail);
    } catch {
      /* the card just stays empty */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSend() {
    setSending(true);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        sent?: boolean;
        delivers?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Илгээхэд алдаа гарлаа");
      if (data.delivers) toast.success(`Тест и-мэйл ${to} рүү илгээгдлээ`);
      else
        toast.warning(
          "EMAIL_PROVIDER=console тул зөвхөн лог руу бичигдлээ — бодит и-мэйл яваагүй.",
        );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-xl border bg-background p-5">
      <h2 className="text-sm font-semibold">Захиалгын и-мэйл</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Шинэ захиалга орж ирэхэд доорх хаягуудад мэдэгдэл очно.
      </p>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Илгээгч</span>
          <span className="text-right">{config?.from ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="shrink-0 text-muted-foreground">Мэдэгдэл хүлээн авагч</span>
          <span className="text-right">
            {config?.notifyTo.length
              ? config.notifyTo.join(", ")
              : <span className="text-destructive">тохируулаагүй</span>}
          </span>
        </div>
      </div>

      {config && !config.delivers && (
        <p className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Одоогийн горим <strong>{config.provider}</strong> — и-мэйл зөвхөн лог
            руу бичигдэж, хэн рүү ч хүрэхгүй. Бодитоор илгээхийн тулд
            <code className="mx-1 rounded bg-secondary px-1">EMAIL_PROVIDER=resend</code>
            болон <code className="rounded bg-secondary px-1">RESEND_API_KEY</code>{" "}
            тохируулна.
          </span>
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="name@example.com"
          inputMode="email"
        />
        <Button onClick={() => void onSend()} disabled={sending || !to}>
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          Тест илгээх
        </Button>
      </div>
    </section>
  );
}
