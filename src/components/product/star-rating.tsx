import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  rating: number;
  className?: string;
  size?: number;
}

export function StarRating({ rating, className, size = 16 }: Props) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}
