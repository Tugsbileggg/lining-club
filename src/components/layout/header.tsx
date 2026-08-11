import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { mainNav, siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { SearchSheet } from "./search-sheet";
import { ThemeToggle } from "./theme-toggle";
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
              width={48}
              height={48}
              priority
              className="h-12 w-12 object-contain invert dark:invert-0"
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
            <Button variant="ghost" size="icon" asChild aria-label="Захиалга хянах">
              <Link href="/track" title="Захиалга хянах">
                <Package className="size-5" />
              </Link>
            </Button>
            <ThemeToggle />
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  );
}
