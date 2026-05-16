"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveTickerFromInput } from "@/lib/constants/tickers";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";

export function WatchlistHeader() {
  const addStock = useWatchlistStore((s) => s.addStock);
  const [showForm, setShowForm] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const resolved = resolveTickerFromInput(input);
    if (!resolved) {
      setError("Enter a supported ticker (e.g. BDO.PS or JFC).");
      return;
    }
    const added = addStock(resolved.ticker);
    if (!added) {
      setError(`${resolved.ticker} is already on your watchlist.`);
      return;
    }
    setInput("");
    setError(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <WatchlistHeaderRow setShowForm={setShowForm} showForm={showForm} />
      {showForm ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Ticker (e.g. BDO.PS)"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd}>Add</Button>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
          {error ? (
            <p className="text-sm text-destructive sm:basis-full" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function WatchlistHeaderRow({
  showForm,
  setShowForm,
}: {
  showForm: boolean;
  setShowForm: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold">My Watchlist</h1>
        <p className="mt-1 text-muted-foreground">
          Track your favorite Philippine stocks
        </p>
      </div>
      <Button className="gap-2" onClick={() => setShowForm(!showForm)}>
        <Plus className="h-4 w-4" />
        Add Stock
      </Button>
    </div>
  );
}
