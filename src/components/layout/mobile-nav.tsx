"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";

export function MobileTopBar() {
  return (
    <header className="flex h-14 items-center border-b bg-card px-4 md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
        <span className="font-semibold">StockLens PH</span>
      </Link>
    </header>
  );
}
