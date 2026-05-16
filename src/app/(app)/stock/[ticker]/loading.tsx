export default function StockLoading() {
  return <StockLoadingSkeleton />;
}

function StockLoadingSkeleton() {
  return (
    <div className="container mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
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
