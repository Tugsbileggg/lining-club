"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { mainNav, siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Цэс"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="uppercase tracking-tight">
            {siteConfig.name}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-2 py-2">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium transition-colors hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t px-5 py-4 text-sm text-muted-foreground">
          <Link href="/track" onClick={() => setOpen(false)} className="block py-1 hover:text-foreground">
            Захиалга хянах
          </Link>
          <a href={`tel:${siteConfig.contact.phone}`} className="block py-1 hover:text-foreground">
            {siteConfig.contact.phone}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
