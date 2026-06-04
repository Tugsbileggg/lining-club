import type { Product } from "@/types";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";

interface Props {
  products: Product[];
  className?: string;
  priorityCount?: number;
}

export function ProductGrid({ products, className, priorityCount = 4 }: Props) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3",
        className,
      )}
    >
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={i < priorityCount}
        />
      ))}
    </div>
  );
}
