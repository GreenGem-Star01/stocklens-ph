import Link from "next/link";

import { ForecastDisclaimer } from "@/components/dashboard/forecast-disclaimer";
import { ForecastsSummary } from "@/components/forecasts/forecasts-summary";
import { ForecastsTabs } from "@/components/forecasts/forecasts-tabs";
import { getForecastsData } from "@/lib/api/market-provider";
import { APP_PAGE_CLASS } from "@/lib/layout";

export default async function ForecastsPage() {
  const { forecasts, modelPerformance, summary } = await getForecastsData();

  return (
    <div className={APP_PAGE_CLASS}>
      <div>
        <h1 className="text-3xl font-semibold">Forecasts</h1>
        <p className="mt-1 text-muted-foreground">
          AI-powered stock price predictions and model performance
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/stocks"
            className="text-primary underline underline-offset-4"
          >
            Looking for a ticker? Browse all stocks
          </Link>
          . Forecasts below use the linear regression baseline across every
          PSE-listed stock with published forecast data.
        </p>
      </div>
      <ForecastsSummary summary={summary} />
      <ForecastsTabs forecasts={forecasts} modelPerformance={modelPerformance} summary={summary} />
      <ForecastDisclaimer />
    </div>
  );
}
