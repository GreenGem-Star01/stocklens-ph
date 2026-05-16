"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TickerCombobox } from "@/components/shared/ticker-combobox";
import { WATCHLIST_MAX_STOCKS } from "@/lib/constants/watchlist";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import {
  formatWatchlistCount,
  watchlistAddDescription,
  watchlistAddToast,
} from "@/lib/watchlist";

export function WatchlistHeader() {
  const stocks = useWatchlistStore((s) => s.stocks);
  const addStock = useWatchlistStore((s) => s.addStock);
  const atLimit = stocks.length >= WATCHLIST_MAX_STOCKS;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>();

  const handleAdd = () => {
    if (!selected) {
      toast.error("Select a ticker to add.");
      return;
    }
    const result = addStock(selected);
    const kind = watchlistAddToast(result);
    const description = watchlistAddDescription(result, selected);
    if (kind === "success") {
      toast.success(description);
      setSelected(undefined);
      setOpen(false);
      return;
    }
    if (kind === "message") toast.message(description);
    else if (kind === "error") toast.error(description);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My Watchlist</h1>
        <p className="mt-1 text-muted-foreground">
          Track your favorite Philippine stocks ·{" "}
          {formatWatchlistCount(stocks.length)}
        </p>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          disabled={atLimit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Stock
        </SheetTrigger>
        <SheetContent side="bottom" className="md:side-right">
          <SheetHeader>
            <SheetTitle>Add to watchlist</SheetTitle>
            <SheetDescription>
              Choose a supported PSE ticker to track.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            <TickerCombobox value={selected} onSelect={setSelected} />
            <Button className="w-full" onClick={handleAdd}>
              Add to watchlist
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
