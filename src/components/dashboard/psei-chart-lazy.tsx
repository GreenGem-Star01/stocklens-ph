"use client";

import dynamic from "next/dynamic";

import type { PseiDataPoint } from "@/lib/types/stock";

const PseiChartInner = dynamic(
  () => import("./psei-chart").then((mod) => mod.PseiChart),
  {
    ssr: false,
    loading: () => (
      <PseiChartSkeleton />
    ),
  },
);

function PseiChartSkeleton() {
  return (
    <div className="h-72 animate-pulse rounded-lg border bg-muted/30" />
  );
}

export function PseiChart({ data }: { data?: PseiDataPoint[] }) {
  return <PseiChartInner data={data} />;
}
