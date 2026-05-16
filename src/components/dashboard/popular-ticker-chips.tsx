"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { POPULAR_TICKER_PATHS } from "@/lib/constants/popular-tickers";
import { TICKER_BY_SYMBOL } from "@/lib/constants/tickers";

export function PopularTickerChips() {
  return (
    <div className="flex flex-wrap gap-2">
      {POPULAR_TICKER_PATHS.map((path) => {
        const ticker = `${path.toUpperCase()}.PS`;
        const entry = TICKER_BY_SYMBOL[ticker];
        const label = entry?.ticker.replace(".PS", "") ?? path.toUpperCase();
        return (
          <Link key={path} href={`/stock/${path}`}>
            <Button variant="secondary" size="sm" className="h-8">
              {label}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
