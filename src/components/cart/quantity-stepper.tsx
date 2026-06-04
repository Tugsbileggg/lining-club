"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  className?: string;
}

export function QuantityStepper({ value, onChange, min = 1, className }: Props) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center rounded-md border",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Хасах"
        className="grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Нэмэх"
        className="grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
