"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { heroSchema, type HeroInput } from "@/lib/validation/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
      )}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function HeroForm({ initial }: { initial: HeroInput }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HeroInput>({
    resolver: zodResolver(heroSchema),
    defaultValues: initial,
  });

  const preview = watch();

  async function onSubmit(values: HeroInput) {
    try {
      const res = await fetch("/api/admin/content/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Хадгалахад алдаа гарлаа");
      }
      toast.success("Hero шинэчлэгдлээ");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field
          label="Зургийн холбоос"
          hint="cdn.shopify.com эсвэл Firebase Storage хаягтай зураг."
          error={errors.image?.message}
        >
          <Input {...register("image")} placeholder="https://cdn.shopify.com/..." />
        </Field>
        <Field label="Жижиг гарчиг (eyebrow)" error={errors.eyebrow?.message}>
          <Input {...register("eyebrow")} placeholder="Lining Club" />
        </Field>
        <Field label="Гарчиг" error={errors.heading?.message}>
          <Input {...register("heading")} placeholder="Шинэ улирлын пүүз" />
        </Field>
        <Field label="Тайлбар" error={errors.subheading?.message}>
          <Input {...register("subheading")} placeholder="Чанартай, загварлаг пүүз..." />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Товчны текст" error={errors.ctaLabel?.message}>
            <Input {...register("ctaLabel")} placeholder="Дэлгүүр хэсэх" />
          </Field>
          <Field
            label="Товчны холбоос"
            hint="Жнь: /products"
            error={errors.ctaHref?.message}
          >
            <Input {...register("ctaHref")} placeholder="/products" />
          </Field>
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </form>

      {/* Live preview — uses a plain img so any typed URL renders before save. */}
      <div>
        <span className="mb-2 block text-sm font-medium text-muted-foreground">
          Урьдчилан харах
        </span>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-neutral-900">
          {preview.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-start justify-end p-5 text-white">
            {preview.eyebrow && (
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/80">
                {preview.eyebrow}
              </p>
            )}
            <p className="mt-1 text-2xl font-bold leading-tight">
              {preview.heading || "Гарчиг"}
            </p>
            {preview.subheading && (
              <p className="mt-1 line-clamp-2 max-w-xs text-xs text-white/85">
                {preview.subheading}
              </p>
            )}
            {preview.ctaLabel && (
              <span className="mt-3 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black">
                {preview.ctaLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
