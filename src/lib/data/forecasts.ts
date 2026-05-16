import type { ForecastTrend } from "@/lib/types/stock";

export type StockForecast = {
  ticker: string;
  company: string;
  sector: string;
  currentPrice: string;
  forecast7d: string;
  trend: ForecastTrend;
  accuracy: string;
  date: string;
  expectedChange?: string;
};

export type ModelPerformance = {
  model: string;
  avgMAE: string;
  avgRMSE: string;
  avgMAPE: string;
  avgAccuracy: string;
};

export const allForecasts: StockForecast[] = [
  {
    ticker: "BDO.PS",
    company: "BDO Unibank",
    sector: "Financials",
    currentPrice: "₱138.50",
    forecast7d: "₱142.00",
    trend: "Projected Upward",
    accuracy: "68%",
    date: "2026-05-16",
    expectedChange: "+2.5%",
  },
  {
    ticker: "JFC.PS",
    company: "Jollibee Foods",
    sector: "Consumer",
    currentPrice: "₱242.00",
    forecast7d: "₱248.50",
    trend: "Projected Upward",
    accuracy: "65%",
    date: "2026-05-16",
    expectedChange: "+2.5%",
  },
  {
    ticker: "ALI.PS",
    company: "Ayala Land",
    sector: "Real Estate",
    currentPrice: "₱32.15",
    forecast7d: "₱31.80",
    trend: "Projected Downward",
    accuracy: "62%",
    date: "2026-05-16",
    expectedChange: "-1.1%",
  },
  {
    ticker: "TEL.PS",
    company: "PLDT Inc.",
    sector: "Telecom",
    currentPrice: "₱1,285.00",
    forecast7d: "₱1,290.00",
    trend: "Mixed Signal",
    accuracy: "59%",
    date: "2026-05-16",
  },
  {
    ticker: "SMPH.PS",
    company: "SM Prime",
    sector: "Real Estate",
    currentPrice: "₱28.90",
    forecast7d: "₱29.50",
    trend: "Projected Upward",
    accuracy: "71%",
    date: "2026-05-16",
    expectedChange: "+2.5%",
  },
  {
    ticker: "PSEI.PS",
    company: "PSEi Index",
    sector: "Index",
    currentPrice: "6,480",
    forecast7d: "6,520",
    trend: "Projected Upward",
    accuracy: "64%",
    date: "2026-05-16",
    expectedChange: "+2.5%",
  },
];

export const modelPerformance: ModelPerformance[] = [
  {
    model: "LSTM",
    avgMAE: "1.45",
    avgRMSE: "1.82",
    avgMAPE: "1.05%",
    avgAccuracy: "65%",
  },
  {
    model: "Linear Regression",
    avgMAE: "1.89",
    avgRMSE: "2.35",
    avgMAPE: "1.38%",
    avgAccuracy: "59%",
  },
  {
    model: "Moving Average",
    avgMAE: "2.12",
    avgRMSE: "2.68",
    avgMAPE: "1.54%",
    avgAccuracy: "56%",
  },
  {
    model: "Naive Baseline",
    avgMAE: "2.58",
    avgRMSE: "3.25",
    avgMAPE: "1.87%",
    avgAccuracy: "51%",
  },
];

export const forecastSummary = {
  totalToday: 6,
  lastUpdated: "May 16, 2026",
  averageAccuracy: "65%",
  upwardCount: 4,
  upwardPercent: "67%",
};
