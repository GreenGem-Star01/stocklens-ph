export function ChartLegend() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="h-0.5 w-6 bg-primary" aria-hidden />
        <span>Historical close</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="h-0.5 w-6 border-t-2 border-dashed border-chart-1"
          aria-hidden
        />
        <span>Forecast</span>
      </div>
    </div>
  );
}
