"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Truck, RotateCcw } from "lucide-react";
import type { Product, ProductVariant } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart } from "@/features/cart/store";
import { formatPrice, discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const SHIPPING_TEXT =
  "Улаанбаатар хотод 1-2 хоногт хүргэнэ. Орон нутагт унаанд тавьж илгээнэ. Хүргэлтийн нөхцөлийг захиалга баталгаажсаны дараа холбогдон тохирно.";

function findVariant(
  product: Product,
  size?: string,
  color?: string,
): ProductVariant | undefined {
  if (product.variants.length === 0) return undefined;
  if (product.sizes.length === 0 && product.colors.length === 0) {
    return product.variants[0];
  }
  return product.variants.find(
    (v) =>
      (product.sizes.length === 0 || v.size === size) &&
      (product.colors.length === 0 || v.color === color),
  );
}

export function ProductBuyBox({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const hasSizes = product.sizes.length > 0;
  const hasColors = product.colors.length > 0;

  const [size, setSize] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<string | undefined>(
    hasColors ? product.colors[0] : undefined,
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(
    () => findVariant(product, size, color),
    [product, size, color],
  );

  const price = selectedVariant?.price ?? product.price;
  const compareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const discount = discountPercent(price, compareAt);

  const availableSizes = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const v of product.variants) {
      if (v.size) map.set(v.size, (map.get(v.size) ?? false) || v.available);
    }
    return map;
  }, [product.variants]);

  function handleAdd() {
    if (hasSizes && !size) {
      toast.error("Хэмжээ сонгоно уу.");
      return;
    }
    const variant = findVariant(product, size, color);
    if (!variant || !variant.available) {
      toast.error("Сонгосон хувилбар дууссан байна.");
      return;
    }
    addItem(product, variant, quantity);
    toast.success("Сагсанд нэмэгдлээ.");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        {product.vendor && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.vendor}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {product.title}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xl font-semibold">{formatPrice(price)}</span>
          {discount > 0 && compareAt && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(compareAt)}
              </span>
              <span className="rounded-full bg-sale px-2 py-0.5 text-xs font-semibold text-white">
                -{discount}%
              </span>
            </>
          )}
        </div>
      </div>

      {hasColors && (
        <div>
          <h3 className="mb-2 text-sm font-medium">
            Өнгө: <span className="text-muted-foreground">{color}</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  color === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:border-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasSizes && (
        <div>
          <h3 className="mb-2 text-sm font-medium">Хэмжээ</h3>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const available = availableSizes.get(s) ?? false;
              return (
                <button
                  key={s}
                  disabled={!available}
                  onClick={() => setSize(s)}
                  className={cn(
                    "min-w-12 rounded-md border px-3 py-2 text-sm transition-colors",
                    size === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-foreground",
                    !available &&
                      "cursor-not-allowed text-muted-foreground/50 line-through hover:border-input",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} />
        <Button size="lg" className="flex-1" onClick={handleAdd}>
          Сагсанд нэмэх
        </Button>
      </div>

      <div className="space-y-2 rounded-lg border p-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Truck className="size-4" /> Улаанбаатар даяар хүргэлттэй
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <RotateCcw className="size-4" /> 24 цагийн дотор солих боломжтой
        </div>
      </div>

      <Accordion type="single" collapsible className="border-t">
        <AccordionItem value="desc">
          <AccordionTrigger>Тайлбар</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {product.description}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="shipping">
          <AccordionTrigger>Хүргэлт</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {SHIPPING_TEXT}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
