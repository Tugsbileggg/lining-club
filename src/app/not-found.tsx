import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center gap-4 py-32 text-center">
      <p className="text-6xl font-bold tracking-tight">404</p>
      <h1 className="text-xl font-semibold">Хуудас олдсонгүй</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Уучлаарай, таны хайсан хуудас олдсонгүй. Дэлгүүр рүү буцаж орно уу.
      </p>
      <Button asChild>
        <Link href="/">Нүүр хуудас</Link>
      </Button>
    </div>
  );
}
