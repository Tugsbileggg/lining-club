"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart, selectSubtotal } from "@/features/cart/store";
import { useMounted } from "@/hooks/use-mounted";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectSubtotal);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const mounted = useMounted();

  if (!mounted) {
    return <div className="container-page py-20" />;
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <ShoppingBag className="size-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Таны сагс хоосон байна</h1>
        <Button asChild size="lg">
          <Link href="/products">Дэлгүүр хэсэх</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">
        Сагс
      </h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.lineId} className="flex gap-4 py-5">
              <Link
                href={`/products/${item.handle}`}
                className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-md bg-secondary sm:w-28"
              >
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                )}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link
                    href={`/products/${item.handle}`}
                    className="font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span className="font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
                {item.size && (
                  <span className="mt-1 text-sm text-muted-foreground">
                    Хэмжээ: {item.size}
                  </span>
                )}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(q) => updateQuantity(item.lineId, q)}
                  />
                  <button
                    onClick={() => removeItem(item.lineId)}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-4" /> Устгах
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-lg border p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-semibold">Захиалгын дүн</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-muted-foreground">Дэд дүн</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Хүргэлт</span>
            <span className="text-muted-foreground">Тооцоолно</span>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between text-base font-semibold">
            <span>Нийт</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/checkout">Захиалга хийх</Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href="/products">Үргэлжлүүлэн худалдан авах</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
