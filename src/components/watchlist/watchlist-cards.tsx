"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WatchlistStock } from "@/lib/data/watchlist";
import { getTrendBadgeVariant, tickerToPath } from "@/lib/forecast";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";

function WatchlistCard({ stock }: { stock: WatchlistStock }) {
  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <WatchlistCardMeta stock={stock} />
          {stock.positive ? (
            <ArrowUpRight className="h-5 w-5 text-emerald-600" />
          ) : (
            <ArrowDownRight className="h-5 w-5 text-red-600" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-end justify-between">
          <span className="text-2xl font-semibold">{stock.price}</span>
          <span
            className={`text-sm font-medium ${
              stock.positive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {stock.change}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Trend:</span>
            <Badge
              variant={getTrendBadgeVariant(stock.trend)}
              className="text-xs"
            >
              {stock.trend}
            </Badge>
          </div>
          <Link href={`/stock/${tickerToPath(stock.ticker)}`}>
            <Button variant="ghost" size="sm" className="h-7">
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function WatchlistCardMeta({ stock }: { stock: WatchlistStock }) {
  return (
    <div className="flex-1">
      <div className="mb-1 flex items-center gap-2">
        <CardTitle className="text-base">{stock.ticker}</CardTitle>
        <Badge variant="outline" className="text-xs">
          {stock.sector}
        </Badge>
      </div>
      <CardDescription className="text-xs">{stock.name}</CardDescription>
    </div>
  );
}

export function WatchlistCards() {
  const stocks = useWatchlistStore((s) => s.stocks);
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stocks.map((stock) => (
        <WatchlistCard key={stock.ticker} stock={stock} />
      ))}
    </div>
  );
}
