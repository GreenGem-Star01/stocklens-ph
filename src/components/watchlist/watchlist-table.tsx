"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PriceChange } from "@/components/ui/price-change";
import { TrendBadge } from "@/components/ui/trend-badge";
import { tickerToPath } from "@/lib/forecast";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";

export function WatchlistTable() {
  const stocks = useWatchlistStore((s) => s.stocks);
  const removeStock = useWatchlistStore((s) => s.removeStock);

  return (
    <Card className="card-interactive">
      <CardHeader>
        <CardTitle>Watchlist Details</CardTitle>
        <CardDescription>Complete view of your tracked stocks</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableCaption className="sr-only">Watchlist stocks</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Trend</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={stock.ticker}>
                <TableCell className="sticky left-0 bg-card font-medium">
                  {stock.ticker}
                </TableCell>
                <TableCell>{stock.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {stock.sector}
                  </Badge>
                </TableCell>
                <TableCell>{stock.price}</TableCell>
                <TableCell>
                  <PriceChange change={stock.change} />
                </TableCell>
                <TableCell>
                  <TrendBadge trend={stock.trend} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {stock.addedDate}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/stock/${tickerToPath(stock.ticker)}`}>
                      <Button variant="outline" size="sm">
                        Analyze
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Remove ${stock.ticker}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove ${stock.ticker} from your watchlist?`,
                          )
                        ) {
                          removeStock(stock.ticker);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
