import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { FORECAST_DISCLAIMER } from "@/lib/forecast";

export function StockDisclaimerAlert() {
  return (
    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        {FORECAST_DISCLAIMER}
      </AlertDescription>
    </Alert>
  );
}
