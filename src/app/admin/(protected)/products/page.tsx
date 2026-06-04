import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { listAllProducts } from "@/services/products";
import { formatPrice } from "@/lib/format";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Идэвхтэй",
  draft: "Ноорог",
  archived: "Архив",
};

export default async function AdminProductsPage() {
  const products = await listAllProducts().catch(() => []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Бараа</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} бараа
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" /> Шинэ бараа
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Бараа</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Брэнд</th>
              <th className="px-4 py-3 font-medium">Үнэ</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Төлөв</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-accent/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-secondary">
                      {p.images[0] && (
                        <Image
                          src={p.images[0].url}
                          alt={p.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <span className="line-clamp-1 font-medium">{p.title}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {p.vendor}
                </td>
                <td className="px-4 py-3">{formatPrice(p.price)}</td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Badge variant={p.status === "active" ? "secondary" : "outline"}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <ProductRowActions id={p.id} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Бараа алга. “Шинэ бараа” дарж нэмнэ үү.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
