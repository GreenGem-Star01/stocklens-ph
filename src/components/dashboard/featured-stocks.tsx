import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getEquityDirectoryCount } from "@/lib/data/stock-directory";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PriceChange, PriceDirectionIcon } from "@/components/ui/price-change";
import { TrendBadge } from "@/components/ui/trend-badge";
import { featuredStocks as defaultFeatured } from "@/lib/data/dashboard";
import { tickerToPath } from "@/lib/forecast";
import type { FeaturedStock } from "@/lib/types/stock";

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
      <PriceDirectionIcon positive={stock.positive} />
    </div>
  );
}

function FeaturedBody({ stock }: { stock: FeaturedStock }) {
  return (
    <>
      <div className="mb-2 flex items-end justify-between">
        <span className="tabular-nums text-2xl font-semibold">{stock.price}</span>
        <PriceChange change={stock.change} positive={stock.positive} className="text-sm" />
      </div>
      <div className="flex items-center gap-1 text-xs">
        <span className="text-muted-foreground">Model trend:</span>
        <TrendBadge trend={stock.trend} className="text-xs" />
      </div>
    </>
  );
}

export function FeaturedStocks({
  stocks = defaultFeatured,
}: {
  stocks?: FeaturedStock[];
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h3>Featured Stocks</h3>
        <Link
          href="/stocks"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View all {getEquityDirectoryCount()} stocks →
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
