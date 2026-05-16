import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { featuredStocks as defaultFeatured } from "@/lib/data/dashboard";
import { getTrendBadgeVariant, tickerToPath } from "@/lib/forecast";
import type { FeaturedStock } from "@/lib/types/stock";

function FeaturedStockCard({ stock }: { stock: FeaturedStock }) {
  return (
    <Link href={`/stock/${tickerToPath(stock.ticker)}`} className="block">
      <Card className="cursor-pointer transition-colors hover:border-primary/50">
        <CardHeader className="pb-3">
          <FeaturedStockHeader stock={stock} />
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
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Model trend:</span>
            <Badge
              variant={getTrendBadgeVariant(stock.trend)}
              className="text-xs"
            >
              {stock.trend}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function FeaturedStockHeader({ stock }: { stock: FeaturedStock }) {
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
      {stock.positive ? (
        <ArrowUpRight className="h-5 w-5 text-emerald-600" />
      ) : (
        <ArrowDownRight className="h-5 w-5 text-red-600" />
      )}
    </div>
  );
}

export function FeaturedStocks({
  stocks = defaultFeatured,
}: {
  stocks?: FeaturedStock[];
}) {
  return (
    <section>
      <h3 className="mb-4 text-lg font-medium">Featured Stocks</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stocks.map((stock) => (
          <FeaturedStockCard key={stock.ticker} stock={stock} />
        ))}
      </div>
    </section>
  );
}
