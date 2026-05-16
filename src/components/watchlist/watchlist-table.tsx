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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTrendBadgeVariant, tickerToPath } from "@/lib/forecast";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";

export function WatchlistTable() {
  const stocks = useWatchlistStore((s) => s.stocks);
  const removeStock = useWatchlistStore((s) => s.removeStock);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watchlist Details</CardTitle>
        <CardDescription>Complete view of your tracked stocks</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
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
                <TableCell className="font-medium">{stock.ticker}</TableCell>
                <TableCell>{stock.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {stock.sector}
                  </Badge>
                </TableCell>
                <TableCell>{stock.price}</TableCell>
                <TableCell>
                  <span
                    className={`font-medium ${
                      stock.positive ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {stock.change}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getTrendBadgeVariant(stock.trend)}>
                    {stock.trend}
                  </Badge>
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
                      onClick={() => removeStock(stock.ticker)}
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
