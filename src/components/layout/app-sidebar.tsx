"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Settings,
  TrendingUp,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { isNavItemActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks },
  { href: "/forecasts", label: "Forecasts", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
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
    </aside>
  );
}
