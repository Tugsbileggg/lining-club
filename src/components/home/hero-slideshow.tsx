"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** How long each image stays on screen before crossfading to the next. */
const SLIDE_MS = 4000;

/**
 * Crossfading hero background. Every image is rendered stacked and only the
 * active one is opaque, so the swap is a fade rather than a swap-in. Images are
 * decorative — the hero heading carries the meaning — hence the empty alt.
 */
export function HeroSlideshow({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    // Respect users who ask the OS to limit motion: show the first image only.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      SLIDE_MS,
    );
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <>
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          aria-hidden
          fill
          priority={i === 0}
          sizes="100vw"
          className={cn(
            "object-cover object-center transition-opacity duration-1000 ease-in-out",
            i === index ? "opacity-90" : "opacity-0",
          )}
        />
      ))}
    </>
  );
}
