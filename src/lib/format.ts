// Currency + locale helpers. The store sells in MNT (no minor unit).

const MNT = new Intl.NumberFormat("mn-MN", {
  maximumFractionDigits: 0,
});

/** Format an MNT integer as e.g. "699,000₮". */
export function formatPrice(amount: number): string {
  return `${MNT.format(Math.round(amount))}₮`;
}

/** Discount percentage from compareAtPrice → price, rounded. 0 if none. */
export function discountPercent(
  price: number,
  compareAtPrice?: number | null,
): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

const DATE = new Intl.DateTimeFormat("mn-MN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(ts: number): string {
  return DATE.format(new Date(ts));
}
