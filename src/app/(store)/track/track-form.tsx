"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Package, Truck, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderStatus } from "@/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS: { key: OrderStatus; label: string; icon: typeof Clock }[] = [
  { key: "pending", label: "Хүлээн авсан", icon: Clock },
  { key: "accepted", label: "Баталгаажсан", icon: Check },
  { key: "fulfilled", label: "Хүргэгдсэн", icon: Truck },
];

interface Result {
  orderNumber: string;
  status: OrderStatus;
  total?: number;
  items?: { title: string; size?: string; quantity: number }[];
}

export function TrackForm({ initialOrder = "" }: { initialOrder?: string }) {
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runLookup = useCallback(async (raw: string) => {
    const number = raw.trim();
    if (!number) {
      setError("Захиалгын дугаараа оруулна уу.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/orders/track?number=${encodeURIComponent(number)}`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        order?: Result;
        error?: string;
      };
      if (!res.ok || !data.order) {
        setError(data.error ?? "Захиалга олдсонгүй.");
        return;
      }
      setResult(data.order);
    } catch {
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-lookup when arriving with ?order=... (e.g. from checkout success).
  useEffect(() => {
    if (initialOrder) void runLookup(initialOrder);
  }, [initialOrder, runLookup]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runLookup(orderNumber);
  }

  const cancelled = result?.status === "cancelled";
  const currentIndex = result
    ? STEPS.findIndex((s) => s.key === result.status)
    : -1;

  return (
    <div className="mx-auto max-w-xl">
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Захиалгын дугаар (жнь: LC-XXXXXX)"
          className="h-11"
        />
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "..." : "Хайх"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {result && (
        <div className="mt-10 rounded-lg border p-6">
          <div className="mb-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="size-5" />
              <span className="font-medium">{result.orderNumber}</span>
            </div>
            {typeof result.total === "number" && (
              <span className="text-sm font-medium">
                {formatPrice(result.total)}
              </span>
            )}
          </div>

          {cancelled ? (
            <div className="flex items-center gap-3 rounded-md bg-destructive/10 p-4 text-destructive">
              <XCircle className="size-5 shrink-0" />
              <span className="text-sm font-medium">
                Энэ захиалга цуцлагдсан байна.
              </span>
            </div>
          ) : (
            <ol className="space-y-6">
              {STEPS.map((step, i) => {
                const done = i <= currentIndex;
                const Icon = step.icon;
                return (
                  <li key={step.key} className="flex items-center gap-4">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full border",
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        !done && "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {result.items && result.items.length > 0 && (
            <ul className="mt-6 space-y-1 border-t pt-4 text-sm text-muted-foreground">
              {result.items.map((i, idx) => (
                <li key={idx}>
                  {i.title}
                  {i.size ? ` (${i.size})` : ""} × {i.quantity}
                </li>
              ))}
            </ul>
          )}

          {!cancelled && (
            <p className="mt-6 text-xs text-muted-foreground">
              Асуудал гарвал бидэнтэй холбогдоно уу.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
