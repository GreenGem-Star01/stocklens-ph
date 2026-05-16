type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{
    value?: number | null;
    dataKey?: string;
    payload?: { date?: string };
  }>;
};

export function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  const price = payload.find((p) => p.dataKey === "price")?.value;
  const forecast = payload.find((p) => p.dataKey === "forecast")?.value;
  const value = price ?? forecast;

  if (value == null) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{point?.date}</p>
      <p className="tabular-nums text-muted-foreground">
        {forecast != null && price == null ? "Forecast: " : ""}₱
        {value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}
