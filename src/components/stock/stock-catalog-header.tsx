import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PseListedCompany } from "@/lib/types/pse-universe";

const Box = "div" as unknown as React.ElementType;

export function StockCatalogHeader({ company }: { company: PseListedCompany }) {
  return (
    <Box className="space-y-4 border-b pb-4">
      <Link
        href="/stocks"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to all stocks
      </Link>
      <Box className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {company.companyName}
        </h1>
        <Box className="flex flex-wrap items-center gap-3">
          <span className="tabular-nums text-lg text-muted-foreground">
            {company.ticker}
          </span>
          <Badge variant="outline">{company.sector}</Badge>
          <Badge variant="secondary">{company.subsector}</Badge>
        </Box>
      </Box>
    </Box>
  );
}
