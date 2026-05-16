"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SUPPORTED_TICKERS } from "@/lib/constants/tickers";
import { tickerToPath } from "@/lib/forecast";

export function TickerQuickChips() {
  return (
    <div className="flex flex-wrap gap-2">
      {SUPPORTED_TICKERS.map((entry) => (
        <Link key={entry.ticker} href={`/stock/${tickerToPath(entry.ticker)}`}>
          <Button variant="secondary" size="sm" className="h-8">
            {entry.ticker.replace(".PS", "")}
          </Button>
        </Link>
      ))}
    </div>
  );
}
