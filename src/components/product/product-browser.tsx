"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/types";
import { facetsOf } from "@/lib/product-utils";
import { ProductGrid } from "./product-grid";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Sort = "featured" | "price-asc" | "price-desc" | "title-asc";

const SORT_LABELS: Record<Sort, string> = {
  featured: "Онцлох",
  "price-asc": "Үнэ: бага → их",
  "price-desc": "Үнэ: их → бага",
  "title-asc": "Нэр: А → Я",
};

interface Props {
  products: Product[];
  title: string;
  description?: string;
}

export function ProductBrowser({ products, title, description }: Props) {
  const facets = useMemo(() => facetsOf(products), [products]);
  const [sizes, setSizes] = useState<Set<string>>(new Set());
  const [vendors, setVendors] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>("featured");

  const filtered = useMemo(() => {
    let out = products.filter((p) => {
      if (sizes.size && !p.sizes.some((s) => sizes.has(s))) return false;
      if (vendors.size && !vendors.has(p.vendor)) return false;
      return true;
    });
    out = [...out];
    switch (sort) {
      case "price-asc":
        out.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        out.sort((a, b) => b.price - a.price);
        break;
      case "title-asc":
        out.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        out.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return out;
  }, [products, sizes, vendors, sort]);

  const activeCount = sizes.size + vendors.size;

  function toggle(set: Set<string>, value: string, apply: (s: Set<string>) => void) {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    apply(next);
  }

  const filterPanel = (
    <div className="space-y-6">
      {facets.sizes.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Хэмжээ</h3>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => (
              <button
                key={s}
                onClick={() => toggle(sizes, s, setSizes)}
                className={cn(
                  "min-w-10 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                  sizes.has(s)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:border-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {facets.vendors.length > 1 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Брэнд</h3>
          <div className="space-y-2">
            {facets.vendors.map((v) => (
              <label
                key={v}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={vendors.has(v)}
                  onChange={() => toggle(vendors, v, setVendors)}
                  className="size-4 accent-primary"
                />
                {v}
              </label>
            ))}
          </div>
        </div>
      )}

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSizes(new Set());
            setVendors(new Set());
          }}
          className="px-0 text-muted-foreground"
        >
          <X className="size-4" /> Шүүлтүүр цэвэрлэх
        </Button>
      )}
    </div>
  );

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{filterPanel}</aside>

        <div>
          <div className="mb-6 flex items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="size-4" />
                    Шүүлтүүр
                    {activeCount > 0 && ` (${activeCount})`}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Шүүлтүүр</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto px-5 py-4">{filterPanel}</div>
                </SheetContent>
              </Sheet>
              <span className="text-sm text-muted-foreground">
                {filtered.length} бараа
              </span>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">
                Эрэмбэлэх:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-9 rounded-md border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {(Object.keys(SORT_LABELS) as Sort[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filtered.length > 0 ? (
            <ProductGrid products={filtered} />
          ) : (
            <p className="py-20 text-center text-sm text-muted-foreground">
              Бараа олдсонгүй.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
