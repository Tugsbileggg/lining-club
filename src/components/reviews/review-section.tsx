"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import type { Review } from "@/types";
import { StarRating } from "@/components/product/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ReviewSection({
  productId,
  initialReviews = [],
}: {
  productId: string;
  initialReviews?: Review[];
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [open, setOpen] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !body.trim()) {
      toast.error("Нэр болон сэтгэгдлээ бичнэ үү.");
      return;
    }
    setSubmitting(true);
    try {
      // TODO(api): POST /api/reviews -> Firestore (status: "pending").
      // Optimistically show the review as awaiting moderation.
      const review: Review = {
        id: crypto.randomUUID(),
        productId,
        author: author.trim(),
        rating: rating as Review["rating"],
        body: body.trim(),
        status: "pending",
        createdAt: Date.now(),
      };
      setReviews((r) => [review, ...r]);
      setAuthor("");
      setBody("");
      setRating(5);
      setOpen(false);
      toast.success("Сэтгэгдэл илгээгдлээ. Шалгасны дараа нийтлэгдэнэ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-t py-12">
      <div className="container-page">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Сэтгэгдэл</h2>
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={avg} />
              <span className="text-sm text-muted-foreground">
                {reviews.length > 0
                  ? `${avg.toFixed(1)} / 5 · ${reviews.length} сэтгэгдэл`
                  : "Одоогоор сэтгэгдэл алга"}
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={() => setOpen((o) => !o)}>
            Сэтгэгдэл бичих
          </Button>
        </div>

        {open && (
          <form
            onSubmit={submit}
            className="mt-6 max-w-xl space-y-4 rounded-lg border p-5"
          >
            <Input
              placeholder="Таны нэр"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  aria-label={`${i} од`}
                >
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      i <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-muted text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Сэтгэгдэл..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? "Илгээж байна..." : "Илгээх"}
            </Button>
          </form>
        )}

        <ul className="mt-8 space-y-6">
          {reviews
            .filter((r) => r.status !== "rejected")
            .map((r) => (
              <li key={r.id} className="border-b pb-6 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                <StarRating rating={r.rating} className="mt-1" size={14} />
                <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                {r.status === "pending" && (
                  <span className="mt-1 inline-block text-xs text-amber-600">
                    Шалгагдаж байна
                  </span>
                )}
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}
