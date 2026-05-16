"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Search } from "lucide-react";

import { PopularTickerChips } from "@/components/dashboard/popular-ticker-chips";
import { Button } from "@/components/ui/button";
import { TickerCombobox } from "@/components/shared/ticker-combobox";
import { getEquityDirectoryCount } from "@/lib/data/stock-directory";
import { tickerToPath } from "@/lib/forecast";

export function StockSearch() {
  const router = useRouter();
  const comboboxRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = () => {
    if (!selected) {
      setError("Select a ticker from the list to analyze.");
      comboboxRef.current?.focus();
      return;
    }
    setError(null);
    router.push(`/stock/${tickerToPath(selected)}`);
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-2xl flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <TickerCombobox
            ref={comboboxRef}
            value={selected}
            onSelect={(ticker) => {
              setSelected(ticker);
              if (error) setError(null);
            }}
            placeholder="Search Philippine stock ticker..."
            className="h-14 border-border bg-input-background pl-12 text-lg shadow-none"
          />
        </div>
        <Button size="lg" className="h-14 shrink-0 px-8" onClick={handleAnalyze}>
          Analyze Stock
        </Button>
      </div>
      {error ? (
        <p className="ml-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <div className="ml-1 space-y-3">
          <p className="text-sm text-muted-foreground">
            Start by searching a Philippine stock ticker, or{" "}
            <Link
              href="/stocks"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              browse all {getEquityDirectoryCount()} stocks
            </Link>
            .
          </p>
          <PopularTickerChips />
        </div>
      )}
    </section>
  );
}
