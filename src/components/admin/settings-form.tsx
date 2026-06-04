"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { settingsSchema, type SettingsInput } from "@/lib/validation/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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

const textareaClass =
  "w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: SettingsInput) {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Хадгалахад алдаа гарлаа");
      }
      toast.success("Тохиргоо хадгалагдлаа");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Зарлал</h2>
        <Field
          label="Дээд талын зарлал"
          hint="Хоосон бол зарлалын зурвас харагдахгүй."
          error={errors.announcement?.message}
        >
          <Input
            {...register("announcement")}
            placeholder="Жнь: Бүх бараанд үнэгүй хүргэлт!"
          />
        </Field>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Хүргэлт & буцаалт</h2>
        <Field label="Хүргэлтийн текст" error={errors.shippingText?.message}>
          <textarea {...register("shippingText")} rows={3} className={textareaClass} />
        </Field>
        <Field label="Буцаалтын текст" error={errors.returnsText?.message}>
          <textarea {...register("returnsText")} rows={3} className={textareaClass} />
        </Field>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Холбоо барих</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Утас" error={errors.contact?.phone?.message}>
            <Input {...register("contact.phone")} placeholder="+976 8800 0000" />
          </Field>
          <Field label="Хаяг" error={errors.contact?.address?.message}>
            <Input {...register("contact.address")} placeholder="Улаанбаатар, Монгол" />
          </Field>
          <Field
            label="Facebook холбоос"
            error={errors.contact?.facebook?.message}
          >
            <Input
              {...register("contact.facebook")}
              placeholder="https://facebook.com/..."
            />
          </Field>
          <Field
            label="Instagram холбоос"
            error={errors.contact?.instagram?.message}
          >
            <Input
              {...register("contact.instagram")}
              placeholder="https://instagram.com/..."
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </div>
    </form>
  );
}
