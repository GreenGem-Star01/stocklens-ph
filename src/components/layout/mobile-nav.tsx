"use client";

import { BrandLogo } from "@/components/brand/brand-logo";

export function MobileTopBar() {
  return (
    <header className="flex h-14 items-center border-b bg-card px-4 md:hidden">
      <BrandLogo markSize={24} />
    </header>
  );
}
