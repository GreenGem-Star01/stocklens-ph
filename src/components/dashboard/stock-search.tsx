"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveTickerFromInput } from "@/lib/constants/tickers";
import { tickerToPath } from "@/lib/forecast";

export function StockSearch() {
  const router = useRouter();
  const [searchTicker, setSearchTicker] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = () => {
    const resolved = resolveTickerFromInput(searchTicker);
    if (!resolved) {
      setError(
        "Enter a supported ticker (BDO.PS, JFC.PS, ALI.PS, TEL.PS, SMPH.PS, or PSEI.PS).",
      );
      return;
    }
    setError(null);
    router.push(`/stock/${tickerToPath(resolved.ticker)}`);
  };

  return (
    <div className="space-y-3">
      <SearchRow
        searchTicker={searchTicker}
        setSearchTicker={(value) => {
          setSearchTicker(value);
          if (error) setError(null);
        }}
        onAnalyze={handleAnalyze}
        hasError={!!error}
      />
      {error ? (
        <p className="ml-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="ml-1 text-sm text-muted-foreground">
          Start by searching a Philippine stock ticker such as{" "}
          <strong>BDO.PS</strong>, <strong>JFC.PS</strong>, or{" "}
          <strong>ALI.PS</strong>.
        </p>
      )}
    </div>
  );
}

function SearchRow({
  searchTicker,
  setSearchTicker,
  onAnalyze,
  hasError,
}: {
  searchTicker: string;
  setSearchTicker: (value: string) => void;
  onAnalyze: () => void;
  hasError: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative max-w-2xl flex-1">
        <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search Philippine stock ticker..."
          className="h-14 pl-12 text-lg"
          value={searchTicker}
          onChange={(e) => setSearchTicker(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAnalyze()}
          aria-invalid={hasError}
        />
      </div>
      <Button size="lg" className="h-14 px-8" onClick={onAnalyze}>
        Analyze Stock
      </Button>
    </div>
  );
}
