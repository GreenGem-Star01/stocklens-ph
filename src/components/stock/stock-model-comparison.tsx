"use client";

import { HelpCircle } from "lucide-react";

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

const metricGlossary: Record<string, string> = {
  MAE: "Mean Absolute Error — average absolute difference between predicted and actual prices.",
  RMSE: "Root Mean Square Error — penalizes larger forecast errors more than MAE.",
  MAPE: "Mean Absolute Percentage Error — error expressed as a percentage of actual price.",
};

function MetricHead({ label }: { label: keyof typeof metricGlossary }) {
  return (
    <TableHead>
      <Tooltip>
        <TooltipTrigger className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-4">
          {label}
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          {metricGlossary[label]}
        </TooltipContent>
      </Tooltip>
    </TableHead>
  );
}

export function StockModelComparison({ analysis }: { analysis: StockAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Comparison</CardTitle>
        <CardDescription>
          Performance comparison across different forecasting approaches
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <MetricHead label="MAE" />
              <MetricHead label="RMSE" />
              <MetricHead label="MAPE" />
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analysis.modelComparison.map((model) => (
              <TableRow key={model.model}>
                <TableCell className="font-medium">{model.model}</TableCell>
                <TableCell>{model.mae}</TableCell>
                <TableCell>{model.rmse}</TableCell>
                <TableCell>{model.mape}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {model.notes}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
