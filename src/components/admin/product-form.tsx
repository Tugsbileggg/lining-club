"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Collection, Product } from "@/types";
import { productInputSchema } from "@/lib/validation/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function ProductForm({
  collections,
  product,
}: {
  collections: Collection[];
  product?: Product;
}) {
  const router = useRouter();
  const editing = Boolean(product);

  const [title, setTitle] = useState(product?.title ?? "");
  const [handle, setHandle] = useState(product?.handle ?? "");
  const [vendor, setVendor] = useState(product?.vendor ?? "Lining Club");
  const [productType, setProductType] = useState(product?.productType ?? "Sneakers");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compareAtPrice ? String(product.compareAtPrice) : "",
  );
  const [status, setStatus] = useState(product?.status ?? "active");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [cols, setCols] = useState<Set<string>>(
    new Set(product?.collectionHandles ?? []),
  );
  const [sizesText, setSizesText] = useState((product?.sizes ?? []).join(", "));
  const [imagesText, setImagesText] = useState(
    (product?.images ?? []).map((i) => i.url).join("\n"),
  );
  const [saving, setSaving] = useState(false);

  function slugify(s: string) {
    return s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      title,
      handle: handle || slugify(title),
      vendor,
      productType,
      description,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      collectionHandles: [...cols],
      sizes: sizesText.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean),
      images: imagesText.split("\n").map((s) => s.trim()).filter(Boolean),
      featured,
      status,
    };

    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first ? `${first.path.join(".")}: ${first.message}` : "Талбар буруу");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/products/${product!.id}` : "/api/admin/products",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Хадгалахад алдаа гарлаа");
      }
      toast.success(editing ? "Шинэчлэгдлээ" : "Бараа нэмэгдлээ");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Field label="Гарчиг">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Handle (URL)" hint="Хоосон бол гарчгаас автоматаар үүснэ">
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={title ? slugify(title) : "jishee-handle"}
          />
        </Field>
        <Field label="Тайлбар">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Брэнд">
            <Input value={vendor} onChange={(e) => setVendor(e.target.value)} />
          </Field>
          <Field label="Төрөл">
            <Input value={productType} onChange={(e) => setProductType(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Үнэ (₮)">
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </Field>
          <Field label="Хямдралын өмнөх үнэ (₮)" hint="Заавал биш">
            <Input
              type="number"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Хэмжээнүүд" hint="Таслал эсвэл хоосон зайгаар тусгаарла. Жнь: 40, 41, 42">
          <Input value={sizesText} onChange={(e) => setSizesText(e.target.value)} />
        </Field>
        <Field label="Зургийн URL-ууд" hint="Мөр бүрт нэг URL">
          <textarea
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            rows={4}
            placeholder="https://...jpg"
            className="w-full rounded-md border bg-background p-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </Field>
      </div>

      <aside className="space-y-5">
        <div className="rounded-lg border p-4">
          <Field label="Төлөв">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Product["status"])}
              className="h-10 w-full rounded-md border bg-background px-2 text-sm"
            >
              <option value="active">Идэвхтэй</option>
              <option value="draft">Ноорог</option>
              <option value="archived">Архивласан</option>
            </select>
          </Field>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="size-4 accent-primary"
            />
            Онцлох бараа
          </label>
        </div>

        <div className="rounded-lg border p-4">
          <span className="mb-2 block text-sm font-medium">Ангилал</span>
          <div className="space-y-2">
            {collections.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={cols.has(c.handle)}
                  onChange={() => {
                    const next = new Set(cols);
                    next.has(c.handle) ? next.delete(c.handle) : next.add(c.handle);
                    setCols(next);
                  }}
                  className="size-4 accent-primary"
                />
                {c.title}
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" className={cn("w-full")} disabled={saving}>
          {saving ? "Хадгалж байна..." : editing ? "Шинэчлэх" : "Нэмэх"}
        </Button>
      </aside>
    </form>
  );
}
