"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/checkout";
import { useCart, selectSubtotal } from "@/features/cart/store";
import { useMounted } from "@/hooks/use-mounted";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectSubtotal);
  const clear = useCart((s) => s.clear);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "qpay" },
  });
  const paymentMethod = watch("paymentMethod");

  async function onSubmit(values: CheckoutInput) {
    // TODO(backend): QPay invoice + confirmation email happen server-side once
    // credentials land. The order itself is now persisted to Firestore.
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: values.name,
            phone: values.phone,
            email: values.email,
            city: values.city,
            address: values.address,
            note: values.note,
          },
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          paymentMethod: values.paymentMethod,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        order?: { orderNumber: string; subtotal: number; total: number; createdAt: number };
        error?: string;
      };
      if (!res.ok || !data.order) {
        throw new Error(data.error ?? "Захиалга үүсгэхэд алдаа гарлаа");
      }

      const { order } = data;
      sessionStorage.setItem(
        "lining:last-order",
        JSON.stringify({
          orderNumber: order.orderNumber,
          items,
          subtotal: order.subtotal,
          total: order.total,
          customer: values,
          createdAt: order.createdAt,
        }),
      );
      clear();
      toast.success("Захиалга амжилттай үүслээ.");
      router.push(`/checkout/success?order=${order.orderNumber}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }

  if (!mounted) return <div className="container-page py-20" />;

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Сагс хоосон байна</h1>
        <Button asChild>
          <Link href="/products">Дэлгүүр хэсэх</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">
        Захиалга
      </h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <form
          id="checkout-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <h2 className="text-lg font-semibold">Хүлээн авагчийн мэдээлэл</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Нэр" error={errors.name?.message}>
              <Input {...register("name")} placeholder="Овог нэр" />
            </Field>
            <Field label="Утас" error={errors.phone?.message}>
              <Input {...register("phone")} placeholder="8800 0000" inputMode="tel" />
            </Field>
          </div>
          <Field label="И-мэйл (заавал биш)" error={errors.email?.message}>
            <Input {...register("email")} placeholder="name@example.com" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Хот / Аймаг" error={errors.city?.message}>
              <Input {...register("city")} placeholder="Улаанбаатар" />
            </Field>
            <Field label="Дэлгэрэнгүй хаяг" error={errors.address?.message}>
              <Input {...register("address")} placeholder="Дүүрэг, хороо, байр" />
            </Field>
          </div>
          <Field label="Нэмэлт тэмдэглэл (заавал биш)" error={errors.note?.message}>
            <textarea
              {...register("note")}
              rows={3}
              placeholder="Хүргэлтийн талаар тэмдэглэл..."
              className="w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </Field>

          <Separator />

          <h2 className="text-lg font-semibold">Төлбөрийн хэлбэр</h2>
          <div className="space-y-2">
            {(
              [
                { v: "qpay", label: "QPay", desc: "QR кодоор төлөх (удахгүй идэвхжинэ)" },
                { v: "manual", label: "Дансаар / Бэлэн", desc: "Захиалга баталгаажсаны дараа холбогдоно" },
              ] as const
            ).map((opt) => (
              <button
                type="button"
                key={opt.v}
                onClick={() => setValue("paymentMethod", opt.v)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                  paymentMethod === opt.v
                    ? "border-primary ring-1 ring-primary"
                    : "hover:border-foreground",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-4 place-items-center rounded-full border",
                    paymentMethod === opt.v && "border-primary",
                  )}
                >
                  {paymentMethod === opt.v && (
                    <span className="size-2 rounded-full bg-primary" />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {opt.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </form>

        <aside className="h-fit rounded-lg border p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-semibold">Таны захиалга</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.lineId} className="flex gap-3">
                <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col text-sm">
                  <span className="line-clamp-1 font-medium">{item.title}</span>
                  <span className="text-muted-foreground">
                    {item.size ? `Хэмжээ ${item.size} · ` : ""}
                    {item.quantity} ш
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Дэд дүн</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Хүргэлт</span>
            <span className="text-muted-foreground">Тооцоолно</span>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between text-base font-semibold">
            <span>Нийт</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Button
            type="submit"
            form="checkout-form"
            size="lg"
            className="mt-6 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Үүсгэж байна..." : "Захиалга баталгаажуулах"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
