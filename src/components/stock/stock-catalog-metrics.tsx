import { PriceChange } from "@/components/ui/price-change";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAsOf, quoteToDisplay } from "@/lib/market/format-quote";
import type { MarketQuote } from "@/lib/market/types";
import type { PseListedCompany } from "@/lib/types/pse-universe";

type StockCatalogMetricsProps = {
  company: PseListedCompany;
  quote: MarketQuote | null;
};

export function StockCatalogMetrics({
  company,
  quote,
}: StockCatalogMetricsProps) {
  const isIndex = company.sector === "Index";

  if (!quote) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Market price</CardTitle>
          <CardDescription>
            No live quote in the database yet. Run{" "}
            <code className="text-xs">npm run ingest:quotes</code> after market
            close, or browse other listings on the directory.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const display = quoteToDisplay(quote, isIndex);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Market price</CardTitle>
        <CardDescription>
          End-of-day data ({quote.source.replace(/_/g, " ")}) · as of{" "}
          {formatAsOf(quote.asOf)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end justify-between gap-4">
        <span className="tabular-nums text-3xl font-semibold">
          {display.lastClose}
        </span>
        <PriceChange
          change={display.dailyChange}
          direction={display.direction}
          className="text-lg"
        />
      </CardContent>
    </Card>
  );
}
