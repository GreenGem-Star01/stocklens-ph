"use client";

import { AlertCircle } from "lucide-react";

import { ForecastMethodologyDialog } from "@/components/forecasts/forecast-methodology-dialog";
import { FORECAST_DISCLAIMER } from "@/lib/forecast";
import { useSettingsStore } from "@/lib/stores/settings-store";

export function ForecastDisclaimer() {
  const show = useSettingsStore((s) => s.showDisclaimerBanners);
  if (!show) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-4">
      <AlertCircle
        className="h-5 w-5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <p className="flex-1 text-sm text-muted-foreground">{FORECAST_DISCLAIMER}</p>
      <ForecastMethodologyDialog />
    </div>
  );
}
