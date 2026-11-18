// Central, editable site configuration. Navigation mirrors the live
// Lining Club Shopify menu. Collection handles match the seeded data
// (kept in Cyrillic to match the original store's handles).

export const siteConfig = {
  name: "Lining Club",
  description: "Lining Club — пүүз, гутал, нэмэлт хэрэгслүүд. Улаанбаатар.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "mn",
  currency: "MNT",
  contact: {
    phone: "+976 8007 7460",
    facebook: "https://www.facebook.com/", // TODO: set real page URL
    instagram: "https://www.instagram.com/", // TODO: set real profile URL
    address: "Улаанбаатар, Монгол",
  },
} as const;

export interface NavItem {
  label: string;
  href: string;
}

/** Primary header navigation (exact labels from the live store). */
export const mainNav: NavItem[] = [
  { label: "Бүх бараа", href: "/products" },
  { label: "Пүүз", href: "/collections/пүүз" },
  { label: "Үүргэвч", href: "/collections/цүнх" },
  { label: "Нэмэлт хэрэгслүүд", href: "/collections/нэмэлт-хэрэгслүүд" },
  { label: "Хямдралтай бараа", href: "/collections/хямдралтай-бараа" },
  { label: "Багцууд", href: "/collections/багц" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Дэлгүүр",
    items: [
      { label: "Бүх бараа", href: "/products" },
      { label: "Пүүз", href: "/collections/пүүз" },
      { label: "Хямдралтай бараа", href: "/collections/хямдралтай-бараа" },
    ],
  },
  {
    title: "Тусламж",
    items: [
      { label: "Захиалга хянах", href: "/track" },
      { label: "Холбоо барих", href: "/pages/contact" },
    ],
  },
];

/**
 * Bank details shown when the buyer picks "Дансаар / Бэлэн" at checkout.
 * Staff match an incoming transfer to an order by the order number the buyer
 * writes in the transfer description, then mark the order paid by hand.
 */
export const bankTransfer = {
  bank: "Голомт банк",
  /** 10-digit domestic account number — what a transfer form asks for. */
  account: "3015171674",
  /** Full IBAN, for transfers that ask for one. */
  iban: "MN80 0015 00 3015171674",
  accountName: "Наранбаяр Энхундрал",
  /** Share of the total that must land before staff confirm the order. */
  depositPercent: 50,
} as const;
