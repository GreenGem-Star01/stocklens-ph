import { APP_PAGE_CLASS } from "@/lib/layout";

export default function StockLoading() {
  return <StockLoadingSkeleton />;
}

function StockLoadingSkeleton() {
  return (
    <div className={APP_PAGE_CLASS}>
      <div className="h-24 animate-pulse rounded-lg bg-muted/40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
      <div className="h-[500px] animate-pulse rounded-lg bg-muted/40" />
    </div>
  );
}
