import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatPrice, discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  product: Product;
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority, className }: Props) {
  const [primary, secondary] = product.images;
  const discount = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.variants.length > 0 && product.variants.every((v) => !v.available);

  return (
    <Link
      href={`/products/${product.handle}`}
      className={cn("group flex flex-col", className)}
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
        {primary && (
          <Image
            src={primary.url}
            alt={primary.alt ?? product.title}
            fill
            priority={priority}
            sizes="(min-width: 768px) 33vw, 50vw"
            className={cn(
              "object-cover transition-opacity duration-500",
              secondary && "group-hover:opacity-0",
            )}
          />
        )}
        {secondary && (
          <Image
            src={secondary.url}
            alt={secondary.alt ?? product.title}
            fill
            sizes="(min-width: 768px) 33vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
          {soldOut && <Badge variant="secondary">Дууссан</Badge>}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {product.vendor && (
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {product.vendor}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline">
          {product.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {formatPrice(product.price)}
          </span>
          {discount > 0 && product.compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
