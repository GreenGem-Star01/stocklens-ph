import { ForecastsSummary } from "@/components/forecasts/forecasts-summary";
import { ForecastsTabs } from "@/components/forecasts/forecasts-tabs";

export default function ForecastsPage() {
  return (
    <div className="container mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold">Forecasts</h1>
        <p className="mt-1 text-muted-foreground">
          AI-powered stock price predictions and model performance
        </p>
      </div>
      <ForecastsSummary />
      <ForecastsTabs />
    </div>
  );
}
