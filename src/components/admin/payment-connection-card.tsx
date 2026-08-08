"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Connection {
  id: string;
  operator: string;
  mode: string;
  status: string;
}

const OPERATOR_LABEL: Record<string, string> = { qpay: "QPay" };
const MODE_LABEL: Record<string, string> = {
  reseller: "Reseller (Wire-ийн мерчант эрхээр)",
  byo: "Өөрийн мерчант эрхээр",
};

/** Wire's status vocabulary is passed through verbatim; only the tone is ours. */
function statusTone(status: string): { label: string; className: string } {
  const s = status.toLowerCase();
  if (["active", "live", "approved", "enabled", "ok"].includes(s)) {
    return { label: status, className: "bg-green-600/10 text-green-700 dark:text-green-500" };
  }
  if (["pending", "review", "submitted", "contract_pending", "awaiting_contract"].includes(s)) {
    return { label: status, className: "bg-amber-500/10 text-amber-700 dark:text-amber-500" };
  }
  if (["rejected", "disabled", "suspended", "failed"].includes(s)) {
    return { label: status, className: "bg-destructive/10 text-destructive" };
  }
  return { label: status, className: "bg-secondary text-muted-foreground" };
}

/**
 * Read-only view of the Wire operator connections (`GET
 * /v1/operator_connections`) plus the `/test` action. Onboarding itself —
 * application, approval, the ДАН-signed contract — happens in the Wire
 * dashboard; this card only reports where it got to.
 */
export function PaymentConnectionCard() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payments/connections");
      const data = (await res.json().catch(() => ({}))) as {
        configured?: boolean;
        connections?: Connection[];
        webhookUrl?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Мэдээлэл авч чадсангүй");
      setConfigured(data.configured ?? false);
      setConnections(data.connections ?? []);
      setWebhookUrl(data.webhookUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onTest(id: string) {
    setTestingId(id);
    try {
      const res = await fetch("/api/admin/payments/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Тест амжилтгүй");
      if (data.ok) toast.success(data.message ?? "Холболт хэвийн ажиллаж байна");
      else toast.error(data.message ?? "Холболт ажиллахгүй байна");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setTestingId(null);
    }
  }

  return (
    <section className="rounded-xl border bg-background p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Төлбөрийн холболт (Wire)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Холболтыг Wire dashboard-ийн “Суваг” хэсэгт үүсгэж, гэрээг ДАН-аар
            баталгаажуулна. Энд зөвхөн төлөв харагдана.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </div>

      <div className="mt-4">
        {loading && connections.length === 0 && (
          <p className="text-sm text-muted-foreground">Ачаалж байна...</p>
        )}

        {error && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" /> {error}
          </p>
        )}

        {!loading && !error && configured === false && (
          <p className="text-sm text-muted-foreground">
            WIRE_API_BASE_URL / WIRE_API_KEY тохируулаагүй байна. Тохируулах
            хүртэл checkout дээр QPay сонголт харагдахгүй.
          </p>
        )}

        {!error && configured && connections.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">
            Идэвхтэй холболт алга. Wire dashboard дээр QPay сувгийн хүсэлтээ
            илгээж, гэрээгээ байгуулна уу.
          </p>
        )}

        <ul className="space-y-2">
          {connections.map((c) => {
            const tone = statusTone(c.status);
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {OPERATOR_LABEL[c.operator] ?? c.operator}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone.className}`}
                    >
                      {tone.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {MODE_LABEL[c.mode] ?? c.mode}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void onTest(c.id)}
                  disabled={testingId === c.id}
                >
                  {testingId === c.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Тест хийх
                </Button>
              </li>
            );
          })}
        </ul>

        {webhookUrl && (
          <div className="mt-4 rounded-lg border border-dashed p-3">
            <p className="text-xs font-medium">Webhook endpoint</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Wire dashboard дээр энэ хаягийг{" "}
              <code className="rounded bg-secondary px-1">payment_intent.succeeded</code>{" "}
              event-тэй бүртгэнэ. Буцаах <code className="rounded bg-secondary px-1">whsec_…</code>{" "}
              нууцыг ганц удаа харуулах тул шууд{" "}
              <code className="rounded bg-secondary px-1">WIRE_WEBHOOK_SECRET</code>-д хадгална уу.
            </p>
            <p className="mt-2 break-all font-mono text-xs">{webhookUrl}</p>
          </div>
        )}
      </div>
    </section>
  );
}
