"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/types";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  title,
}: {
  images: ProductImage[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
        {current && (
          <Image
            src={current.url}
            alt={current.alt ?? title}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              aria-label={`Зураг ${i + 1}`}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md bg-secondary ring-offset-2 transition",
                i === active
                  ? "ring-2 ring-primary"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${title} ${i + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
