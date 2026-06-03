import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type MarketDataNoticeProps = {
  hasQuotes: boolean;
};

export function MarketDataNotice({ hasQuotes }: MarketDataNoticeProps) {
  if (hasQuotes) return null;

  return (
    <Alert variant="default" className="border-amber-500/40 bg-amber-500/10">
      <AlertTitle>Market prices not loaded</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Catalog rows show official PSE listings only until end-of-day quotes
          are ingested. Blue-chip rows with demo forecasts use seeded prices.
        </p>
        <p className="font-mono text-xs">
          npm run setup:market-data
        </p>
        <p className="text-xs text-muted-foreground">
          Then restart <code className="text-xs">npm run dev</code> so the app
          reloads the snapshot.
        </p>
        <p className="text-xs text-muted-foreground">
          Or use{" "}
          <code className="text-xs">MARKET_DATA_SOURCE=db</code> with{" "}
          <code className="text-xs">npm run ingest:quotes</code> after applying{" "}
          <Link href="/terms" className="underline underline-offset-2">
            db/migrations
          </Link>
          .
        </p>
      </AlertDescription>
    </Alert>
  );
}
