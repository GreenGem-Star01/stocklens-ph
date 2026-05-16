import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export function StockMarketContext({ analysis }: { analysis: StockAnalysis }) {
  const { marketContext } = analysis;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle>Market Context</CardTitle>
        </div>
        <CardDescription>Recent developments and sector performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">Recent PSE Disclosures</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {marketContext.disclosures.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium">PSEi Movement</h4>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">
              Index: <strong>{marketContext.pseiIndex}</strong>
            </span>
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
              {marketContext.pseiChange}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Market trending {marketContext.pseiPositive ? "upward" : "downward"}
            </span>
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium">Sector Context</h4>
          <p className="text-sm text-muted-foreground">{marketContext.sectorNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}