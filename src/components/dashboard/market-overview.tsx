"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { PriceChange } from "@/components/ui/price-change";
import { useMarketSession } from "@/lib/hooks/use-market-session";
import { marketOverview as defaultOverview } from "@/lib/data/dashboard";
import { directionFromChangeString, type PriceDirection } from "@/lib/market/change-direction";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { cn } from "@/lib/utils";

type MarketOverviewData = typeof defaultOverview;

const PSEI_TICKER = "PSEI.PS";
const POLL_INTERVAL_MS = 60_000;

// Plain utility classes, not the `.trend-chip-*` helpers in globals.css —
// Badge's default variant (`bg-primary`) is also a utility, and utilities
// always win over `@layer components` classes regardless of source order,
// so `.trend-chip-*` silently loses to it. `variant="outline"` below drops
// the conflicting default background/text so these take effect (same
// pattern TrendBadge already uses successfully).
const trendChipClass: Record<PriceDirection, string> = {
  up: "border-trend-up/30 bg-trend-up text-trend-up-foreground",
  down: "border-trend-down/30 bg-trend-down text-trend-down-foreground",
  flat: "border-trend-mixed/40 bg-trend-mixed text-trend-mixed-foreground",
};

const trendChipIcon: Record<PriceDirection, typeof ArrowUpRight> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
};

function OverviewStat({
  ticker,
  change,
  positive,
}: {
  ticker: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{ticker}</div>
      <PriceChange change={change} positive={positive} className="font-semibold" />
    </div>
  );
}

export function MarketOverview({
  data = defaultOverview,
  liveQuotesAvailable = false,
}: {
  data?: MarketOverviewData;
  liveQuotesAvailable?: boolean;
}) {
  const { status } = useMarketSession();
  const autoRefresh = useSettingsStore((s) => s.autoRefresh);
  const isLive = liveQuotesAvailable && autoRefresh && status === "open";
  const [pseiValue, setPseiValue] = useState(data.pseiValue);
  const [pseiChange, setPseiChange] = useState(data.pseiChange);
  const pseiDirection = directionFromChangeString(pseiChange);
  const PseiTrendIcon = trendChipIcon[pseiDirection];

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `/api/market/quotes?symbols=${encodeURIComponent(PSEI_TICKER)}`,
        );
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as {
          quotes?: Record<string, { lastClose: string; dailyChange: string }>;
        };
        const quote = body.quotes?.[PSEI_TICKER];
        if (quote && !cancelled) {
          setPseiValue(quote.lastClose);
          setPseiChange(quote.dailyChange);
        }
      } catch {
        // keep last known value
      }
    }

    void poll();
    const id = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isLive]);

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <h3>Market Overview</h3>
        {isLive ? <LiveIndicator /> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>PSEi Trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-2xl font-semibold">
                {pseiValue}
              </span>
              <Badge
                variant="outline"
                className={cn(trendChipClass[pseiDirection], "hover:opacity-90")}
              >
                <PseiTrendIcon className="mr-1 h-3 w-3" aria-hidden />
                {pseiChange}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Top Gainer</CardDescription>
          </CardHeader>
          <CardContent>
            <OverviewStat
              ticker={data.topGainer.ticker}
              change={data.topGainer.change}
              positive
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Top Loser</CardDescription>
          </CardHeader>
          <CardContent>
            <OverviewStat
              ticker={data.topLoser.ticker}
              change={data.topLoser.change}
              positive={false}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Market Status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge
              variant="outline"
              className={cn(
                trendChipClass[status === "open" ? "up" : "flat"],
                "hover:opacity-90",
              )}
            >
              {data.marketStatus}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.marketCloseNote}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
