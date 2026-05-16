"use client";

import Link from "next/link";
import { forwardRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SUPPORTED_TICKERS } from "@/lib/constants/tickers";
import { cn } from "@/lib/utils";

export const TICKER_SEARCH_TRIGGER_ID = "ticker-search-trigger";

type TickerComboboxProps = {
  value?: string;
  onSelect: (ticker: string) => void;
  placeholder?: string;
  className?: string;
  triggerId?: string;
};

export const TickerCombobox = forwardRef<HTMLButtonElement, TickerComboboxProps>(
  function TickerCombobox(
    {
      value,
      onSelect,
      placeholder = "Search ticker (e.g. BDO.PS)",
      className,
      triggerId = TICKER_SEARCH_TRIGGER_ID,
    },
    ref,
  ) {
    const [open, setOpen] = useState(false);

    const selected = SUPPORTED_TICKERS.find((t) => t.ticker === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          ref={ref}
          id={triggerId}
          className={cn(
            "inline-flex h-14 w-full items-center justify-between rounded-md border border-input bg-background px-4 text-left text-sm font-normal shadow-xs",
            className,
          )}
        >
          {selected ? (
            <span>
              <span className="font-medium">{selected.ticker}</span>
              <span className="ml-2 text-muted-foreground">{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Filter by ticker or company..." />
            <CommandList>
              <CommandEmpty>
                No ticker found.{" "}
                <Link
                  href="/stocks"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Browse all stocks
                </Link>
              </CommandEmpty>
              <CommandGroup>
                {SUPPORTED_TICKERS.map((entry) => (
                  <CommandItem
                    key={entry.ticker}
                    value={`${entry.ticker} ${entry.name} ${entry.sector}`}
                    onSelect={() => {
                      onSelect(entry.ticker);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === entry.ticker ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{entry.ticker}</span>
                      <span className="text-xs text-muted-foreground">
                        {entry.name} · {entry.sector}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
