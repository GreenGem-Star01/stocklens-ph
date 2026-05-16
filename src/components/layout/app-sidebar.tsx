"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  ListChecks,
  Settings,
  TrendingUp,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { isNavItemActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stocks", label: "Stocks", icon: LineChart },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks },
  { href: "/forecasts", label: "Forecasts", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">StockLens PH</span>
        </Link>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = isNavItemActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                buttonVariants({
                  variant: isActive ? "default" : "ghost",
                }),
                "w-full justify-start gap-2",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t p-4 text-xs text-muted-foreground">
        <p className="mb-2">Educational research tool — not financial advice.</p>
        <Link href="/terms" className="text-primary hover:underline">
          Terms & disclaimer
        </Link>
      </div>
    </aside>
  );
}
