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
  // Each full-size image is mounted up front (see below), so loading state is
  // tracked per image — the skeleton only covers the one being viewed.
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  function markLoaded(i: number) {
    setLoaded((prev) => (prev[i] ? prev : { ...prev, [i]: true }));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
        {!loaded[active] && (
          <div className="absolute inset-0 z-10 animate-pulse bg-muted" />
        )}

        {/*
          Every image is rendered stacked instead of swapping a single `src`.
          Swapping meant each thumbnail tap started a cold fetch *and* an
          on-demand /_next/image optimisation at that exact moment, which is
          what made switching slow regardless of connection speed. Mounting
          them all moves that work to page load, so a tap is just an opacity
          change.
        */}
        {images.map((img, i) => {
          // The first image drives LCP, so it gets a preload hint. The rest are
          // still fetched eagerly, just without competing for that hint.
          const priorityProps =
            i === 0 ? { priority: true } : { loading: "eager" as const };

          return (
            <Image
              key={`${img.url}-${i}`}
              src={img.url}
              alt={img.alt ?? title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              onLoad={() => markLoaded(i)}
              // A cached image can finish before React attaches onLoad — on a
              // back-navigation that would leave the skeleton up forever.
              ref={(el) => {
                if (el?.complete) markLoaded(i);
              }}
              className={cn(
                "object-cover transition-opacity duration-200",
                i === active && loaded[i] ? "opacity-100" : "opacity-0",
              )}
              {...priorityProps}
            />
          );
        })}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
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
