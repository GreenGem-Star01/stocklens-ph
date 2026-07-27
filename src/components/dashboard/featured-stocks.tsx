"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { getListedEquityCount } from "@/lib/constants/tickers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { PriceChange, PriceDirectionIcon } from "@/components/ui/price-change";
import { TrendBadge } from "@/components/ui/trend-badge";
import { useMarketSession } from "@/lib/hooks/use-market-session";
import { featuredStocks as defaultFeatured } from "@/lib/data/dashboard";
import { tickerToPath } from "@/lib/forecast";
import type { FeaturedStock } from "@/lib/types/stock";

const POLL_INTERVAL_MS = 60_000;

function FeaturedStockCard({ stock }: { stock: FeaturedStock }) {
  return (
    <Link href={`/stock/${tickerToPath(stock.ticker)}`} className="block">
      <Card className="cursor-pointer transition-colors hover:border-primary/50">
        <CardHeader className="pb-3">
          <FeaturedHeader stock={stock} />
        </CardHeader>
        <CardContent>
          <FeaturedBody stock={stock} />
        </CardContent>
      </Card>
    </Link>
  );
}

function FeaturedHeader({ stock }: { stock: FeaturedStock }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <CardTitle className="text-base">{stock.ticker}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {stock.sector}
          </Badge>
        </div>
        <CardDescription className="text-xs">{stock.name}</CardDescription>
      </div>
      <PriceDirectionIcon direction={stock.direction} />
    </div>
  );
}

function FeaturedBody({ stock }: { stock: FeaturedStock }) {
  return (
    <>
      <div className="mb-2 flex items-end justify-between">
        <span className="tabular-nums text-2xl font-semibold">{stock.price}</span>
        <PriceChange
          change={stock.change}
          direction={stock.direction}
          className="text-sm"
        />
      </div>
      <div className="flex items-center gap-1 text-xs">
        <span className="text-muted-foreground">Model trend:</span>
        <TrendBadge trend={stock.trend} className="text-xs" />
      </div>
    </>
  );
}

export function FeaturedStocks({
  stocks: initialStocks = defaultFeatured,
  liveQuotesAvailable = false,
}: {
  stocks?: FeaturedStock[];
  liveQuotesAvailable?: boolean;
}) {
  const { status } = useMarketSession();
  const isLive = liveQuotesAvailable && status === "open";
  const [stocks, setStocks] = useState(initialStocks);

  useEffect(() => {
    if (!isLive || initialStocks.length === 0) return;
    let cancelled = false;
    const symbols = initialStocks.map((s) => s.ticker).join(",");

    async function poll() {
      try {
        const res = await fetch(
          `/api/market/quotes?symbols=${encodeURIComponent(symbols)}`,
        );
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as {
          quotes?: Record<
            string,
            {
              lastClose: string;
              dailyChange: string;
              direction?: "up" | "down" | "flat";
              positive: boolean;
            }
          >;
        };
        const quotes = body.quotes;
        if (!quotes || cancelled) return;

        setStocks((prev) =>
          prev.map((stock) => {
            const q = quotes[stock.ticker];
            if (!q) return stock;
            return {
              ...stock,
              price: q.lastClose,
              change: q.dailyChange,
              direction: q.direction ?? (q.positive ? "up" : "down"),
              positive: q.positive,
            };
          }),
        );
      } catch {
        // keep last known values
      }
    }

    void poll();
    const id = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isLive, initialStocks]);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3>Featured Stocks</h3>
          {isLive ? <LiveIndicator /> : null}
        </div>
        <Link
          href="/stocks"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View all {getListedEquityCount()} stocks →
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stocks.map((stock) => (
          <FeaturedStockCard key={stock.ticker} stock={stock} />
        ))}
      </div>
    </section>
  );
}
