import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  title: string;
  href?: string;
  cta?: string;
}

export function SectionHeading({ title, href, cta = "Бүгдийг үзэх" }: Props) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {cta}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
