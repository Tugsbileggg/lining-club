"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, selectCount } from "@/features/cart/store";
import { useMounted } from "@/hooks/use-mounted";

export function CartButton() {
  const count = useCart(selectCount);
  const openCart = useCart((s) => s.openCart);
  const mounted = useMounted();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Сагс"
      onClick={openCart}
      className="relative"
    >
      <ShoppingBag className="size-5" />
      {mounted && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
          {count}
        </span>
      )}
    </Button>
  );
}
