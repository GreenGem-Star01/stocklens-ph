"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  filterStockDirectory,
  getDirectorySectors,
  getEquityDirectoryCount,
  type StockDirectoryEntry,
} from "@/lib/data/stock-directory";

type StockDirectoryProps = {
  entries: StockDirectoryEntry[];
};

function DirectoryCard({ entry }: { entry: StockDirectoryEntry }) {
  return (
    <Card className="card-interactive">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{entry.ticker}</CardTitle>
            <CardDescription className="text-xs">{entry.name}</CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">
            {entry.sector}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="tabular-nums text-xl font-semibold">
            {entry.lastClose}
          </span>
          <PriceChange
            change={entry.dailyChange}
            positive={entry.positive}
            className="text-sm"
          />
        </div>
        <TrendBadge trend={entry.trend} className="text-xs" />
        <Link href={`/stock/${entry.path}`} className="block">
          <Button variant="outline" size="sm" className="w-full">
            Analyze
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function DirectoryTable({ entries }: { entries: StockDirectoryEntry[] }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <Table>
        <TableCaption className="sr-only">
          Philippine blue-chip stocks and PSEi index
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Last close</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Trend</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.ticker}>
              <TableCell className="font-medium">{entry.ticker}</TableCell>
              <TableCell>{entry.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {entry.sector}
                </Badge>
              </TableCell>
              <TableCell className="tabular-nums">{entry.lastClose}</TableCell>
              <TableCell>
                <PriceChange
                  change={entry.dailyChange}
                  positive={entry.positive}
                />
              </TableCell>
              <TableCell>
                <TrendBadge trend={entry.trend} className="text-xs" />
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/stock/${entry.path}`}>
                  <Button variant="outline" size="sm">
                    Analyze
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function StockDirectory({ entries }: StockDirectoryProps) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");

  const sectors = useMemo(() => getDirectorySectors(entries), [entries]);

  const filtered = useMemo(
    () => filterStockDirectory(entries, query, sector),
    [entries, query, sector],
  );

  const equityCount = getEquityDirectoryCount();

  const clearFilters = () => {
    setQuery("");
    setSector("all");
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 space-y-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ticker, company, or sector..."
              className="pl-9"
              aria-label="Search stocks"
            />
          </div>
          <Select value={sector} onValueChange={(v) => v && setSector(v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sectors</SelectItem>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {entries.length} instruments
          {sector === "all" && !query
            ? ` · ${equityCount} blue-chip equities plus PSEi index`
            : null}
        </p>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground">
              No stocks match your search.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <DirectoryTable entries={filtered} />
          <div className="grid gap-4 md:hidden">
            {filtered.map((entry) => (
              <DirectoryCard key={entry.ticker} entry={entry} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
