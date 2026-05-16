"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { FORECAST_DISCLAIMER } from "@/lib/forecast";
import { useSettingsStore } from "@/lib/stores/settings-store";

export function StockDisclaimerAlert() {
  const show = useSettingsStore((s) => s.showDisclaimerBanners);
  if (!show) return null;

  return (
    <Alert>
      <AlertDescription>{FORECAST_DISCLAIMER}</AlertDescription>
    </Alert>
  );
}
