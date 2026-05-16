import Link from "next/link";

import { ForecastsSummary } from "@/components/forecasts/forecasts-summary";
import { ForecastsTabs } from "@/components/forecasts/forecasts-tabs";
import { APP_PAGE_CLASS } from "@/lib/layout";

export default function ForecastsPage() {
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
            className="text-primary underline-offset-4 hover:underline"
          >
            Looking for a ticker? Browse all stocks
          </Link>
        </p>
      </div>
      <ForecastsSummary />
      <ForecastsTabs />
    </div>
  );
}
