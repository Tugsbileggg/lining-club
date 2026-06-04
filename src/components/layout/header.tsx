import Image from "next/image";
import Link from "next/link";
import { mainNav, siteConfig } from "@/config/site";
import { MobileNav } from "./mobile-nav";
import { SearchSheet } from "./search-sheet";
import { CartButton } from "@/components/cart/cart-button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      <div className="border-b">
        <div className="container-page flex h-16 items-center gap-3">
          <MobileNav />

          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt={siteConfig.name}
              width={600}
              height={600}
              priority
              className="h-12 w-12 object-contain"
            />
          </Link>

          <nav className="mx-auto hidden items-center gap-6 lg:flex">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
            <SearchSheet />
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  );
}
