import Link from "next/link";
import { listReviews } from "@/services/reviews";
import { listAllProducts } from "@/services/products";
import { StarRating } from "@/components/product/star-rating";
import { ReviewRowActions } from "@/components/admin/review-row-actions";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { ReviewStatus } from "@/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Хүлээгдэж буй",
  approved: "Зөвшөөрсөн",
  rejected: "Татгалзсан",
};

const FILTERS: { value: ReviewStatus | "all"; label: string }[] = [
  { value: "pending", label: "Хүлээгдэж буй" },
  { value: "approved", label: "Зөвшөөрсөн" },
  { value: "rejected", label: "Татгалзсан" },
  { value: "all", label: "Бүгд" },
];

function isStatus(v: string | undefined): v is ReviewStatus {
  return v === "pending" || v === "approved" || v === "rejected";
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active: ReviewStatus | "all" = isStatus(status) ? status : "pending";

  const [reviews, products] = await Promise.all([
    listReviews(isStatus(status) ? status : undefined).catch(() => []),
    listAllProducts().catch(() => []),
  ]);
  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Сэтгэгдэл</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Хэрэглэгчийн сэтгэгдлийг зөвшөөрөх, татгалзах, устгах.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/reviews" : `/admin/reviews?status=${f.value}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              active === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {reviews.map((r) => {
          const product = productMap.get(r.productId);
          return (
            <div
              key={r.id}
              className="rounded-xl border bg-background p-4 sm:flex sm:items-start sm:justify-between sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating rating={r.rating} size={14} />
                  <span className="text-sm font-medium">{r.author}</span>
                  <Badge
                    variant={r.status === "approved" ? "secondary" : "outline"}
                  >
                    {STATUS_LABEL[r.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                {r.title && (
                  <p className="mt-2 text-sm font-medium">{r.title}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Бараа:{" "}
                  {product ? (
                    <Link
                      href={`/products/${product.handle}`}
                      className="hover:underline"
                    >
                      {product.title}
                    </Link>
                  ) : (
                    r.productId
                  )}
                </p>
              </div>
              <div className="mt-3 sm:mt-0">
                <ReviewRowActions id={r.id} status={r.status} />
              </div>
            </div>
          );
        })}
        {reviews.length === 0 && (
          <div className="rounded-xl border bg-background px-4 py-10 text-center text-muted-foreground">
            {active === "pending"
              ? "Хүлээгдэж буй сэтгэгдэл алга."
              : "Сэтгэгдэл алга."}
          </div>
        )}
      </div>
    </div>
  );
}
