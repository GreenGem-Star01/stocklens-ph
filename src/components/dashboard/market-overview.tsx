import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { PriceChange } from "@/components/ui/price-change";
import { marketOverview as defaultOverview } from "@/lib/data/dashboard";

type MarketOverviewData = typeof defaultOverview;

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
}: {
  data?: MarketOverviewData;
}) {
  return (
    <section>
      <h3 className="mb-4">Market Overview</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>PSEi Trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-2xl font-semibold">
                {data.pseiValue}
              </span>
              <Badge className="trend-chip-up hover:opacity-90">
                <ArrowUpRight className="mr-1 h-3 w-3" aria-hidden />
                {data.pseiChange}
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
            <Badge className="trend-chip-up hover:opacity-90">
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
