import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PseListedCompany } from "@/lib/types/pse-universe";

export function StockCatalogProfile({ company }: { company: PseListedCompany }) {
  const sectorQuery = encodeURIComponent(company.sector);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Listed on the PSE</CardTitle>
          <CardDescription>
            Official sector data from PSE EDGE. Forecast demos are available for
            select blue-chip tickers only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{company.sector}</Badge>
            <Badge variant="secondary">{company.subsector}</Badge>
            {company.listingDate ? (
              <Badge variant="outline">Listed {company.listingDate}</Badge>
            ) : null}
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Stock symbol</dt>
              <dd className="font-medium">{company.ticker}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Company</dt>
              <dd className="font-medium">{company.companyName}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3">
            {company.edgeCompanyUrl ? (
              <a
                href={company.edgeCompanyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" className="gap-2">
                  View on PSE EDGE
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Button>
              </a>
            ) : null}
            <Link href={`/stocks?sector=${sectorQuery}`}>
              <Button variant="secondary">Browse {company.sector}</Button>
            </Link>
            <Link href="/stocks">
              <Button>All PSE stocks</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
