"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allForecasts, modelPerformance } from "@/lib/data/forecasts";
import {
  FORECAST_DISCLAIMER,
  getTrendBadgeVariant,
  isDownwardTrend,
  isUpwardTrend,
  tickerToPath,
} from "@/lib/forecast";
import type { StockForecast } from "@/lib/data/forecasts";

function ForecastTable({
  forecasts,
  showSector = true,
  showExpectedChange = false,
  expectedChangeLabel = "Expected Change",
}: {
  forecasts: StockForecast[];
  showSector?: boolean;
  showExpectedChange?: boolean;
  expectedChangeLabel?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Company</TableHead>
          {showSector && <TableHead>Sector</TableHead>}
          <TableHead>Current Price</TableHead>
          <TableHead>7-Day Forecast</TableHead>
          {showExpectedChange ? (
            <TableHead>{expectedChangeLabel}</TableHead>
          ) : (
            <TableHead>Trend</TableHead>
          )}
          <TableHead>Accuracy</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {forecasts.map((forecast) => (
          <TableRow key={forecast.ticker}>
            <TableCell className="font-medium">{forecast.ticker}</TableCell>
            <TableCell>{forecast.company}</TableCell>
            {showSector && (
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {forecast.sector}
                </Badge>
              </TableCell>
            )}
            <TableCell>{forecast.currentPrice}</TableCell>
            <TableCell
              className={`font-medium ${
                showExpectedChange && isUpwardTrend(forecast.trend)
                  ? "text-emerald-600"
                  : showExpectedChange && isDownwardTrend(forecast.trend)
                    ? "text-red-600"
                    : ""
              }`}
            >
              {forecast.forecast7d}
            </TableCell>
            {showExpectedChange ? (
              <TableCell
                className={`font-medium ${
                  isUpwardTrend(forecast.trend)
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {forecast.expectedChange ?? "—"}
              </TableCell>
            ) : (
              <TableCell>
                <Badge variant={getTrendBadgeVariant(forecast.trend)}>
                  {forecast.trend}
                </Badge>
              </TableCell>
            )}
            <TableCell>{forecast.accuracy}</TableCell>
            <TableCell className="text-right">
              <Link href={`/stock/${tickerToPath(forecast.ticker)}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ForecastsTabs() {
  const upwardForecasts = allForecasts.filter((f) => isUpwardTrend(f.trend));
  const downwardForecasts = allForecasts.filter((f) => isDownwardTrend(f.trend));

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">All Forecasts</TabsTrigger>
        <TabsTrigger value="upward">Projected Upward</TabsTrigger>
        <TabsTrigger value="downward">Projected Downward</TabsTrigger>
        <TabsTrigger value="performance">Model Performance</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>All Stock Forecasts</CardTitle>
            <CardDescription>7-day price forecasts using LSTM model</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <ForecastTable forecasts={allForecasts} />
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">{FORECAST_DISCLAIMER}</p>
      </TabsContent>

      <TabsContent value="upward" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Projected Upward Forecasts</CardTitle>
            <CardDescription>
              Stocks with predicted upward movement
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <ForecastTable
              forecasts={upwardForecasts}
              showSector={false}
              showExpectedChange
              expectedChangeLabel="Expected Gain"
            />
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">{FORECAST_DISCLAIMER}</p>
      </TabsContent>

      <TabsContent value="downward" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Projected Downward Forecasts</CardTitle>
            <CardDescription>
              Stocks with predicted downward movement
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <ForecastTable
              forecasts={downwardForecasts}
              showSector={false}
              showExpectedChange
              expectedChangeLabel="Expected Loss"
            />
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">{FORECAST_DISCLAIMER}</p>
      </TabsContent>

      <TabsContent value="performance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Model Performance Comparison</CardTitle>
            <CardDescription>
              Average performance metrics across all forecasts
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Avg MAE</TableHead>
                  <TableHead>Avg RMSE</TableHead>
                  <TableHead>Avg MAPE</TableHead>
                  <TableHead>Avg Accuracy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelPerformance.map((model) => (
                  <TableRow key={model.model}>
                    <TableCell className="font-medium">{model.model}</TableCell>
                    <TableCell>{model.avgMAE}</TableCell>
                    <TableCell>{model.avgRMSE}</TableCell>
                    <TableCell>{model.avgMAPE}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          model.model === "LSTM" ? "default" : "secondary"
                        }
                      >
                        {model.avgAccuracy}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              The <strong>LSTM model</strong> consistently outperforms traditional
              baseline models across all metrics, achieving an average directional
              accuracy of <strong>65%</strong>.
            </p>
            <p className="text-muted-foreground">
              While the model shows improvement over simpler approaches, users
              should combine these forecasts with fundamental analysis, technical
              indicators, and market context before making any investment
              decisions.
            </p>
            <p className="text-muted-foreground">
              Model performance varies by sector, with Financials and Consumer
              stocks showing higher accuracy compared to more volatile sectors
              like Real Estate.
            </p>
            <p className="text-muted-foreground">{FORECAST_DISCLAIMER}</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
