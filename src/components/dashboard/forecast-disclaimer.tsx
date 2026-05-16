import { AlertCircle } from "lucide-react";

import { FORECAST_DISCLAIMER } from "@/lib/forecast";

export function ForecastDisclaimer() {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{FORECAST_DISCLAIMER}</p>
    </div>
  );
}
