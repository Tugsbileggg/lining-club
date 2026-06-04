import { Construction } from "lucide-react";

export function ComingSoon({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border bg-background p-16 text-center">
        <Construction className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {note ?? "Энэ хэсэг удахгүй нэмэгдэнэ."}
        </p>
      </div>
    </div>
  );
}
