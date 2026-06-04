"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuantityStepper } from "./quantity-stepper";
import { useCart, selectCount, selectSubtotal } from "@/features/cart/store";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const setOpen = useCart((s) => s.setOpen);
  const items = useCart((s) => s.items);
  const count = useCart(selectCount);
  const subtotal = useCart(selectSubtotal);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Сагс ({count})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Таны сагс хоосон байна.</p>
            <Button onClick={() => setOpen(false)} asChild>
              <Link href="/products">Дэлгүүр рүү очих</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.lineId} className="flex gap-3">
                    <Link
                      href={`/products/${item.handle}`}
                      onClick={() => setOpen(false)}
                      className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-md bg-secondary"
                    >
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <Link
                          href={`/products/${item.handle}`}
                          onClick={() => setOpen(false)}
                          className="line-clamp-2 text-sm font-medium hover:underline"
                        >
                          {item.title}
                        </Link>
                        <button
                          aria-label="Устгах"
                          onClick={() => removeItem(item.lineId)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {item.size && (
                        <span className="mt-0.5 text-xs text-muted-foreground">
                          Хэмжээ: {item.size}
                        </span>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(q) => updateQuantity(item.lineId, q)}
                        />
                        <span className="text-sm font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <SheetFooter>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Нийт дүн</span>
                <span className="text-base font-semibold">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <Separator className="mb-3" />
              <div className="grid gap-2">
                <Button size="lg" className="w-full" asChild>
                  <Link href="/checkout" onClick={() => setOpen(false)}>
                    Захиалга хийх
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/cart" onClick={() => setOpen(false)}>
                    Сагс харах
                  </Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
