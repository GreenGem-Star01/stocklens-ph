export type ForecastTrend =
  | "Projected Upward"
  | "Projected Downward"
  | "Mixed Signal";

export type FeaturedStock = {
  ticker: string;
  name: string;
  price: string;
  change: string;
  positive: boolean;
  sector: string;
  trend: ForecastTrend;
};

export type RecentAnalysisRow = {
  ticker: string;
  company: string;
  close: string;
  trend: ForecastTrend;
  updated: string;
};

export type PseiDataPoint = {
  date: string;
  value: number;
};
