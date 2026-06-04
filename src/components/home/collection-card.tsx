import Image from "next/image";
import Link from "next/link";

interface Props {
  title: string;
  href: string;
  image?: string;
}

export function CollectionCard({ title, href, image }: Props) {
  return (
    <Link href={href} className="group relative block overflow-hidden rounded-lg">
      <div className="relative aspect-[4/5] bg-secondary">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300" />
        )}
        <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-lg font-semibold text-white drop-shadow-sm">
          {title}
        </h3>
      </div>
    </Link>
  );
}
