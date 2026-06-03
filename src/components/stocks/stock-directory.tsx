"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  getDirectorySubsectors,
  getDirectorySectors,
  getEquityDirectoryCount,
  type StockDirectoryEntry,
} from "@/lib/data/stock-directory";
import {
  filterDirectoryByKind,
  filterDirectoryByTier,
  sortDirectoryEntries,
  type DirectoryKindFilter,
  type DirectorySortKey,
  type DirectoryTierFilter,
} from "@/lib/data/stock-directory-filters";
import { buildStocksBrowseUrl } from "@/lib/pse/sector-slug";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

type StockDirectoryProps = {
  entries: StockDirectoryEntry[];
  sectorCounts: Record<string, number>;
  initialQuery?: string;
  initialSector?: string;
  initialSubsector?: string;
};

function resolveInitialSector(
  value: string | undefined,
  sectors: string[],
): string {
  if (!value) return "all";
  const decoded = decodeURIComponent(value);
  return sectors.includes(decoded) ? decoded : "all";
}

function KindBadge({ kind }: { kind: StockDirectoryEntry["kind"] }) {
  if (kind === "equity") return null;
  return (
    <Badge variant="outline" className="text-xs">
      {kind === "etf" ? "ETF" : "Index"}
    </Badge>
  );
}

function hasMarketPrice(entry: StockDirectoryEntry): boolean {
  return entry.lastClose !== "—";
}

function AnalysisBadge({ entry }: { entry: StockDirectoryEntry }) {
  if (entry.hasAnalysis && entry.trend) {
    return <TrendBadge trend={entry.trend} className="text-xs" />;
  }
  return (
    <Badge variant="secondary" className="text-xs">
      Catalog
    </Badge>
  );
}

function DirectoryCard({ entry }: { entry: StockDirectoryEntry }) {
  return (
    <Card className="card-interactive">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1">
              <CardTitle className="text-base">{entry.ticker}</CardTitle>
              <KindBadge kind={entry.kind} />
            </div>
            <CardDescription className="text-xs">{entry.name}</CardDescription>
            <p className="mt-1 text-xs text-muted-foreground">
              {entry.subsector}
            </p>
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
          {hasMarketPrice(entry) ? (
            <PriceChange
              change={entry.dailyChange}
              direction={entry.changeDirection}
              className="text-sm"
            />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
        <AnalysisBadge entry={entry} />
        <Link href={`/stock/${entry.path}`} className="block">
          <Button variant="outline" size="sm" className="w-full">
            {entry.hasAnalysis ? "Analyze" : "View"}
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
          PSE listed companies by official sector
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Subsector</TableHead>
            <TableHead>Last close</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.ticker}>
              <TableCell className="font-medium">
                <span className="inline-flex items-center gap-1">
                  {entry.ticker}
                  <KindBadge kind={entry.kind} />
                </span>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {entry.name}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {entry.sector}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {entry.subsector}
              </TableCell>
              <TableCell className="tabular-nums">{entry.lastClose}</TableCell>
              <TableCell>
                {hasMarketPrice(entry) ? (
                  <PriceChange
                    change={entry.dailyChange}
                    direction={entry.changeDirection}
                  />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <AnalysisBadge entry={entry} />
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/stock/${entry.path}`}>
                  <Button variant="outline" size="sm">
                    {entry.hasAnalysis ? "Analyze" : "View"}
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

export function StockDirectory({
  entries,
  sectorCounts,
  initialQuery = "",
  initialSector,
  initialSubsector,
}: StockDirectoryProps) {
  const router = useRouter();
  const sectors = useMemo(() => getDirectorySectors(entries), [entries]);

  const [query, setQuery] = useState(initialQuery);
  const [sector, setSector] = useState(() =>
    resolveInitialSector(initialSector, sectors),
  );
  const [subsector, setSubsector] = useState(() => {
    if (!initialSubsector || initialSubsector === "all") return "all";
    return decodeURIComponent(initialSubsector);
  });
  const [tier, setTier] = useState<DirectoryTierFilter>("all");
  const [kind, setKind] = useState<DirectoryKindFilter>("all");
  const [sortKey, setSortKey] = useState<DirectorySortKey>("ticker");
  const [page, setPage] = useState(1);

  const subsectors = useMemo(
    () => getDirectorySubsectors(entries, sector),
    [entries, sector],
  );

  useEffect(() => {
    if (sector === "all" || subsector === "all") return;
    if (!subsectors.includes(subsector)) {
      setSubsector("all");
    }
  }, [sector, subsector, subsectors]);

  const syncUrl = useCallback(
    (next: { query: string; sector: string; subsector: string }) => {
      const href = buildStocksBrowseUrl({
        query: next.query,
        sector: next.sector,
        subsector: next.subsector,
      });
      router.replace(href, { scroll: false });
    },
    [router],
  );

  const filtered = useMemo(() => {
    let list = filterStockDirectory(entries, query, sector, subsector);
    list = filterDirectoryByTier(list, tier);
    list = filterDirectoryByKind(list, kind);
    return sortDirectoryEntries(list, sortKey);
  }, [entries, query, sector, subsector, tier, kind, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [query, sector, subsector, tier, kind, sortKey]);

  useEffect(() => {
    syncUrl({ query, sector, subsector });
  }, [query, sector, subsector, syncUrl]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const equityCount = getEquityDirectoryCount();

  const clearFilters = () => {
    setQuery("");
    setSector("all");
    setSubsector("all");
    setTier("all");
    setKind("all");
    setSortKey("ticker");
    setPage(1);
  };

  const tierChips: { id: DirectoryTierFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "hasPrice", label: "Has price" },
    { id: "analyzed", label: "Demo forecast" },
    { id: "catalog", label: "Catalog only" },
  ];

  const kindChips: { id: DirectoryKindFilter; label: string }[] = [
    { id: "all", label: "All types" },
    { id: "equity", label: "Equities" },
    { id: "etf", label: "ETFs" },
    { id: "index", label: "Indices" },
  ];

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 space-y-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ticker, company, sector..."
              className="pl-9"
              aria-label="Search stocks"
            />
          </div>
          <Select
            value={sector}
            onValueChange={(v) => {
              if (v) {
                setSector(v);
                setSubsector("all");
              }
            }}
          >
            <SelectTrigger className="w-full lg:w-52">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sectors</SelectItem>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {s} ({sectorCounts[s] ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={subsector}
            onValueChange={(v) => v && setSubsector(v)}
            disabled={sector === "all"}
          >
            <SelectTrigger className="w-full lg:w-52">
              <SelectValue placeholder="Subsector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subsectors</SelectItem>
              {subsectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortKey}
            onValueChange={(v) => v && setSortKey(v as DirectorySortKey)}
          >
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ticker">Sort: Ticker A–Z</SelectItem>
              <SelectItem value="change">Sort: % change</SelectItem>
              <SelectItem value="price">Sort: Last close</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          {tierChips.map((chip) => (
            <Button
              key={chip.id}
              type="button"
              variant="outline"
              size="sm"
              className={cn(tier === chip.id && "border-primary bg-primary/10")}
              onClick={() => setTier(chip.id)}
            >
              {chip.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {kindChips.map((chip) => (
            <Button
              key={chip.id}
              type="button"
              variant="outline"
              size="sm"
              className={cn(kind === chip.id && "border-primary bg-primary/10")}
              onClick={() => setKind(chip.id)}
            >
              {chip.label}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
          {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
          ( {entries.length} total · {equityCount} listed equities )
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
          <DirectoryTable entries={pageEntries} />
          <div className="grid gap-4 md:hidden">
            {pageEntries.map((entry) => (
              <DirectoryCard key={entry.ticker} entry={entry} />
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
