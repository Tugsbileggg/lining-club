"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SearchSheet() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Хайх">
          <Search className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="h-auto">
        <SheetHeader>
          <SheetTitle>Хайлт</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="flex gap-2 px-5 pb-6">
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Бараа хайх..."
            className="h-11"
          />
          <Button type="submit" size="lg" className="rounded-md">
            Хайх
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
