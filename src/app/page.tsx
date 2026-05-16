import Link from "next/link";
import {
  BarChart3,
  Brain,
  Lightbulb,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GITHUB_REPO_URL } from "@/lib/constants/site";
import { FORECAST_DISCLAIMER } from "@/lib/forecast";

const features = [
  {
    icon: TrendingUp,
    title: "Philippine Stock Data",
    description:
      "Access comprehensive historical data for Philippine Stock Exchange (PSE) listed companies.",
  },
  {
    icon: Brain,
    title: "LSTM Forecasting",
    description:
      "Advanced deep learning models predict 7-day price movements with confidence metrics.",
  },
  {
    icon: BarChart3,
    title: "Baseline Comparison",
    description:
      "Compare LSTM against naive, moving average, and linear regression baselines.",
  },
  {
    icon: Lightbulb,
    title: "AI Market Insight",
    description:
      "Get plain-language explanations of forecast trends and market patterns.",
  },
] as const;

const pageContainer = "container mx-auto w-full max-w-7xl px-4 md:px-8";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-muted/20">
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className={`${pageContainer} flex h-16 items-center`}>
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">StockLens PH</span>
          </Link>
          <nav className="ml-auto flex gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="w-full">
        <section className={`${pageContainer} py-20 md:py-32`}>
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h1 className="font-sans text-4xl font-bold tracking-tight md:text-6xl">
              StockLens PH
            </h1>
            <p className="text-xl text-muted-foreground md:text-2xl">
              Explore Philippine stock trends with AI-assisted forecasting and
              model comparison.
            </p>
            <p className="text-sm font-medium text-muted-foreground">
              30 PSE blue-chip tickers · 7-day experimental forecasts
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="px-8 py-6 text-lg">
                  Start Analyzing
                </Button>
              </Link>
              <Link href="/stock/bdo">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                  View sample analysis
                </Button>
              </Link>
              <Link href="/watchlist">
                <Button size="lg" variant="ghost" className="px-6 py-6 text-lg">
                  Watchlist
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className={`${pageContainer} py-16`}>
          <div className="grid w-full gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="card-interactive border-2"
              >
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className={`${pageContainer} py-16`}>
          <div className="mx-auto max-w-3xl">
            <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-yellow-600 dark:text-yellow-500">
                    ⚠️
                  </span>
                  Important Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>For educational and research purposes only.</strong>{" "}
                  This tool is designed for learning about forecasting
                  techniques and exploring historical stock data patterns.
                </p>
                <p>
                  The forecasts and insights provided are{" "}
                  <strong>not financial advice</strong> and should not be used
                  as the sole basis for investment decisions. Past performance
                  does not guarantee future results.
                </p>
                <p>{FORECAST_DISCLAIMER}</p>
                <p>
                  Always consult with licensed financial advisors before making
                  investment decisions.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="mt-16 w-full border-t">
        <div
          className={`${pageContainer} flex flex-col items-center gap-3 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left`}
        >
          <p>© 2026 StockLens PH. Educational tool for stock analysis research.</p>
          <nav className="flex flex-wrap justify-center gap-4 sm:justify-end">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
