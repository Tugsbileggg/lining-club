"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { paymentTokenKey } from "@/lib/payments/session";
import { Button } from "@/components/ui/button";

type Phase =
  | "loading" // asking our server for a checkout URL
  | "redirecting" // handing the buyer over to pay.wire.mn
  | "verifying" // back from Wire, waiting for the payment to confirm
  | "unconfirmed" // came back but Wire has not reported success (yet)
  | "paid"
  | "failed"
  | "error"
  | "no-token";

/** How long to wait for confirmation after the buyer returns from Wire. */
const POLL_INTERVAL_MS = 2_000;
const VERIFY_WINDOW_MS = 30_000;

export function QpayPanel({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const goToSuccess = useCallback(() => {
    sessionStorage.removeItem(paymentTokenKey(orderNumber));
    router.replace(
      `/checkout/success?order=${encodeURIComponent(orderNumber)}&paid=1`,
    );
  }, [orderNumber, router]);

  /** Ask our server, which re-reads the intent from Wire. */
  const checkStatus = useCallback(async (): Promise<string | null> => {
    const token = tokenRef.current;
    if (!token) return null;
    const res = await fetch("/api/payments/qpay/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, token }),
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { status?: string };
    return data.status ?? null;
  }, [orderNumber]);

  /** Open a hosted checkout session and hand the buyer over to Wire. */
  const startCheckout = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/payments/qpay/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, token }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        status?: string;
        url?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Төлбөрийн хуудас нээж чадсангүй");

      if (data.status === "paid") {
        setPhase("paid");
        goToSuccess();
        return;
      }
      if (!data.url) throw new Error("Төлбөрийн хаяг ирсэнгүй");

      setPhase("redirecting");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      setPhase("error");
    }
  }, [orderNumber, goToSuccess]);

  // Entry point. `?return=1` marks a comeback from Wire — verify rather than
  // open another session, or the buyer would bounce straight back out.
  useEffect(() => {
    const token = sessionStorage.getItem(paymentTokenKey(orderNumber));
    if (!token) {
      setPhase("no-token");
      return;
    }
    tokenRef.current = token;

    const returning = new URLSearchParams(window.location.search).has("return");
    if (returning) setPhase("verifying");
    else void startCheckout();
  }, [orderNumber, startCheckout]);

  // Confirmation poll. The redirect itself proves nothing — Wire's own docs say
  // to confirm server-side — so the order only moves when the API agrees.
  useEffect(() => {
    if (phase !== "verifying") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;
      try {
        const status = await checkStatus();
        if (cancelled) return;
        if (status === "paid") {
          setPhase("paid");
          goToSuccess();
          return;
        }
        if (status === "failed") {
          setPhase("failed");
          return;
        }
      } catch {
        // Transient — try again inside the window.
      }
      if (cancelled) return;
      if (Date.now() - startedAt > VERIFY_WINDOW_MS) {
        setPhase("unconfirmed");
        return;
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phase, checkStatus, goToSuccess]);

  async function onManualCheck() {
    setChecking(true);
    try {
      const status = await checkStatus();
      if (status === "paid") {
        setPhase("paid");
        goToSuccess();
      } else if (status === "failed") {
        setPhase("failed");
      } else {
        toast.info("Төлбөр хараахан баталгаажаагүй байна.");
      }
    } finally {
      setChecking(false);
    }
  }

  const trackLink = `/track?order=${encodeURIComponent(orderNumber)}`;

  if (phase === "no-token") {
    return (
      <Shell orderNumber={orderNumber}>
        <TriangleAlert className="size-10 text-muted-foreground" />
        <p className="mt-4 max-w-sm text-sm text-muted-foreground">
          Энэ төлбөрийн хуудсыг нээх эрх олдсонгүй. Захиалга үүссэн хөтчөөсөө
          дахин оролдоно уу, эсвэл захиалгаа хянаж бидэнтэй холбогдоно уу.
        </p>
        <Actions>
          <Button asChild>
            <Link href={trackLink}>Захиалга хянах</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/products">Дэлгүүр хэсэх</Link>
          </Button>
        </Actions>
      </Shell>
    );
  }

  if (phase === "paid") {
    return (
      <Shell orderNumber={orderNumber}>
        <CheckCircle2 className="size-12 text-green-600" />
        <p className="mt-4 text-sm text-muted-foreground">
          Төлбөр баталгаажлаа. Захиалгын хуудас руу шилжиж байна...
        </p>
      </Shell>
    );
  }

  if (phase === "loading" || phase === "redirecting" || phase === "verifying") {
    const message =
      phase === "loading"
        ? "Төлбөрийн хуудас бэлтгэж байна..."
        : phase === "redirecting"
          ? "Төлбөрийн хуудас руу шилжиж байна..."
          : "Төлбөрийг баталгаажуулж байна...";
    return (
      <Shell orderNumber={orderNumber}>
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </Shell>
    );
  }

  if (phase === "unconfirmed") {
    return (
      <Shell orderNumber={orderNumber}>
        <Loader2 className="size-10 text-muted-foreground" />
        <p className="mt-4 max-w-sm text-sm text-muted-foreground">
          Төлбөр хараахан баталгаажаагүй байна. Банкнаас мэдээлэл ирэхэд хэдэн
          хором зарцуулж болно. Төлсөн бол доорх товчоор шалгана уу — захиалга
          үүссэн хэвээр байгаа тул мөнгө хоёр удаа гарахгүй.
        </p>
        <Actions>
          <Button onClick={onManualCheck} disabled={checking}>
            {checking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Төлбөрөө шалгах
          </Button>
          <Button variant="outline" onClick={() => void startCheckout()}>
            <ExternalLink className="size-4" /> Дахин төлөх
          </Button>
          <Button asChild variant="ghost">
            <Link href={trackLink}>Захиалга хянах</Link>
          </Button>
        </Actions>
      </Shell>
    );
  }

  // phase === "error" | "failed"
  return (
    <Shell orderNumber={orderNumber}>
      <TriangleAlert className="size-10 text-destructive" />
      <p className="mt-4 max-w-sm text-sm text-muted-foreground">
        {phase === "failed"
          ? "Төлбөр амжилтгүй боллоо эсвэл нэхэмжлэхийн хугацаа дууссан байна. Захиалга хэвээр байгаа тул дахин оролдож болно."
          : (error ?? "Алдаа гарлаа")}
      </p>
      <Actions>
        <Button onClick={() => void startCheckout()}>
          <RefreshCw className="size-4" /> Дахин оролдох
        </Button>
        <Button asChild variant="outline">
          <Link href={trackLink}>Захиалга хянах</Link>
        </Button>
      </Actions>
    </Shell>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>;
}

function Shell({
  orderNumber,
  children,
}: {
  orderNumber: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <p className="mb-6 text-sm text-muted-foreground">
        Захиалга <span className="font-medium text-foreground">{orderNumber}</span>
      </p>
      {children}
    </div>
  );
}
