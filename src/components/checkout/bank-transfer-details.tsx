"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { bankTransfer } from "@/config/site";
import { formatPrice } from "@/lib/format";

/**
 * Where to send a bank transfer, and how much of the total unlocks the order.
 *
 * Shown at checkout (before the order exists) and again on the confirmation
 * page and email, because a buyer who closes the tab otherwise has no way back
 * to the account number. `orderNumber` is what staff match the transfer
 * against, so it is spelled out as soon as there is one.
 */
export function BankTransferDetails({
  total,
  orderNumber,
}: {
  total: number;
  orderNumber?: string;
}) {
  const deposit = Math.ceil((total * bankTransfer.depositPercent) / 100);

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(bankTransfer.account);
      toast.success("Дансны дугаар хуулагдлаа");
    } catch {
      toast.error("Хуулж чадсангүй");
    }
  }

  return (
    <div className="rounded-lg border bg-secondary/40 p-4 text-left">
      <p className="text-sm font-medium">Шилжүүлэх данс</p>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Банк</dt>
          <dd>{bankTransfer.bank}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Дансны дугаар</dt>
          <dd className="flex items-center gap-2">
            <span className="font-mono font-medium">{bankTransfer.account}</span>
            <button
              type="button"
              onClick={() => void copyAccount()}
              aria-label="Дансны дугаар хуулах"
              className="rounded-md border p-1 transition-colors hover:border-foreground"
            >
              <Copy className="size-3.5" />
            </button>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Хүлээн авагч</dt>
          <dd className="text-right">{bankTransfer.accountName}</dd>
        </div>
        {orderNumber && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Гүйлгээний утга</dt>
            <dd className="font-mono font-medium">{orderNumber}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
        <p className="text-xs leading-relaxed">
          Нийт дүнгийн <strong>{bankTransfer.depositPercent}%</strong> буюу{" "}
          <strong>{formatPrice(deposit)}</strong> шилжүүлснээр захиалга
          баталгаажна.{" "}
          {orderNumber ? (
            <>
              Гүйлгээний утгад <strong>{orderNumber}</strong> гэж заавал бичнэ үү.
            </>
          ) : (
            <>Гүйлгээний утгад захиалгын дугаараа бичнэ үү — дугаар нь захиалга үүсмэгц харагдана.</>
          )}
        </p>
      </div>
    </div>
  );
}
