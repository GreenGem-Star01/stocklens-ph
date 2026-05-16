"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Settings, TrendingUp } from "lucide-react";

import { isNavItemActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks },
  { href: "/forecasts", label: "Forecasts", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <span className="font-semibold">StockLens PH</span>
      </Link>
      <nav className="flex gap-1">
        {items.map(({ href, icon: Icon }) => {
          const isActive = isNavItemActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md p-2",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
              aria-label={href}
            >
              <Icon className="h-4 w-4" />
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
