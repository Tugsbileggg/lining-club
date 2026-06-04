"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

interface Summary {
  orderNumber: string;
  subtotal: number;
  items: { lineId: string; title: string; quantity: number; price: number; size?: string }[];
}

export function OrderConfirmation({ orderNumber }: { orderNumber: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("lining:last-order");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Summary;
        if (parsed.orderNumber === orderNumber) setSummary(parsed);
      } catch {
        /* ignore */
      }
    }
  }, [orderNumber]);

  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <CheckCircle2 className="size-14 text-green-600" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Захиалга баталгаажлаа
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Захиалгын дугаар: <span className="font-medium text-foreground">{orderNumber}</span>.
        Бид тантай удахгүй холбогдоно.
      </p>

      {summary && (
        <div className="mt-8 w-full max-w-md rounded-lg border p-6 text-left">
          <ul className="space-y-2 text-sm">
            {summary.items.map((i) => (
              <li key={i.lineId} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {i.title}
                  {i.size ? ` (${i.size})` : ""} × {i.quantity}
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t pt-3 text-sm font-semibold">
            <span>Нийт</span>
            <span>{formatPrice(summary.subtotal)}</span>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href={`/track?order=${orderNumber}`}>Захиалга хянах</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">Үргэлжлүүлэн худалдан авах</Link>
        </Button>
      </div>
    </div>
  );
}
