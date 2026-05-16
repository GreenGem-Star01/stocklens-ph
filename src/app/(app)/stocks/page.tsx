import { StockDirectory } from "@/components/stocks/stock-directory";
import {
  getEquityDirectoryCount,
  getStockDirectoryEntries,
} from "@/lib/data/stock-directory";
import { APP_PAGE_CLASS } from "@/lib/layout";

export default function StocksPage() {
  const entries = getStockDirectoryEntries();
  const equityCount = getEquityDirectoryCount();

  return (
    <div className={APP_PAGE_CLASS}>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">All stocks</h1>
        <p className="mt-1 text-muted-foreground">
          Browse {equityCount} Philippine blue-chip equities and the PSEi index.
          Search by ticker, company, or sector.
        </p>
      </div>
      <StockDirectory entries={entries} />
    </div>
  );
}
