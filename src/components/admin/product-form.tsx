"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { Collection, Product } from "@/types";
import { productInputSchema } from "@/lib/validation/product";
import { compressImage } from "@/lib/image/compress";
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

/** The image field stores one URL per line; blank lines are ignored. */
function splitUrls(text: string) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Vercel caps a serverless request body at ~4.5MB; stay clear of it. */
const MAX_BATCH_BYTES = 3.5 * 1024 * 1024;

/** Split a selection so no single upload request exceeds the body limit. */
function batchBySize(files: File[]) {
  const batches: File[][] = [];
  let current: File[] = [];
  let bytes = 0;

  for (const file of files) {
    if (current.length > 0 && bytes + file.size > MAX_BATCH_BYTES) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(file);
    bytes += file.size;
  }
  if (current.length > 0) batches.push(current);
  return batches;
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageUrls = splitUrls(imagesText);

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = [...(e.target.files ?? [])];
    // Clear straight away so re-picking the same file still fires onChange.
    e.target.value = "";
    if (picked.length === 0) return;

    setUploading(true);
    let added = 0;
    try {
      const compressed: File[] = [];
      for (const file of picked) compressed.push(await compressImage(file));

      for (const batch of batchBySize(compressed)) {
        const body = new FormData();
        for (const file of batch) body.append("files", file);

        const res = await fetch("/api/admin/upload", { method: "POST", body });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Байршуулахад алдаа гарлаа");
        }
        const { urls } = (await res.json()) as { urls: string[] };
        // Commit each batch as it lands so a later failure keeps the earlier ones.
        setImagesText((prev) => [...splitUrls(prev), ...urls].join("\n"));
        added += urls.length;
      }
      toast.success(`${added} зураг нэмэгдлээ`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
      if (added > 0) toast.info(`${added} зураг амжилттай нэмэгдсэн`);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setImagesText((prev) =>
      splitUrls(prev)
        .filter((_, i) => i !== index)
        .join("\n"),
    );
  }

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
      images: splitUrls(imagesText),
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
        {/* Not a <Field>: its <label> wrapper would forward clicks to the file
            input and open the picker twice. */}
        <div>
          <span className="mb-1.5 block text-sm font-medium">Зураг</span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onPickFiles}
            className="hidden"
          />

          {imageUrls.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {imageUrls.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative aspect-square overflow-hidden rounded-md border bg-secondary/40"
                >
                  {/* Admins may paste any host, so skip next/image's allowlist. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label="Зураг устгах"
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-sm hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full sm:w-auto"
          >
            {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {uploading ? "Байршуулж байна..." : "Зураг сонгох"}
          </Button>
          <span className="mt-1 block text-xs text-muted-foreground">
            Утас эсвэл компьютерээсээ шууд сонгоно. Олныг зэрэг сонгож болно.
          </span>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              URL-аар оруулах
            </summary>
            <textarea
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              rows={4}
              placeholder="https://...jpg"
              aria-label="Зургийн URL-ууд"
              className="mt-2 w-full rounded-md border bg-background p-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </details>
        </div>
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
