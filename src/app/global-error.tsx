"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import "./globals.css";

// Only fires when the root layout itself throws — route-level errors are
// handled by (app)/error.tsx and stock/[ticker]/error.tsx instead. Must
// render its own <html>/<body> since it replaces the root layout entirely.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground">
            StockLens PH hit an unexpected error loading this page.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
