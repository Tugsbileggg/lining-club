import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  href: string;
  image?: string;
  /**
   * `image` is the store logo standing in for a category with no product
   * imagery yet. The logo is white on transparency, so it needs a dark plate
   * and must be contained rather than cropped like a product photo.
   */
  logo?: boolean;
}

export function CollectionCard({ title, href, image, logo }: Props) {
  return (
    <Link href={href} className="group relative block overflow-hidden rounded-lg">
      <div
        className={cn(
          "relative aspect-[4/5]",
          logo ? "bg-neutral-900" : "bg-secondary",
        )}
      >
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(min-width: 768px) 33vw, 50vw"
            className={cn(
              "transition-transform duration-500 group-hover:scale-105",
              // Extra bottom padding keeps the logo clear of the title.
              logo ? "object-contain p-8 pb-14" : "object-cover",
            )}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300" />
        )}
        <div
          className={cn(
            "absolute inset-0 transition-colors",
            logo
              ? "bg-black/10 group-hover:bg-black/20"
              : "bg-black/20 group-hover:bg-black/30",
          )}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-lg font-semibold text-white drop-shadow-sm">
          {title}
        </h3>
      </div>
    </Link>
  );
}
