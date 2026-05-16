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
import { recentAnalysis as defaultRecent } from "@/lib/data/dashboard";
import type { RecentAnalysisRow } from "@/lib/types/stock";
import { getTrendBadgeVariant, tickerToPath } from "@/lib/forecast";

export function RecentAnalysisTable({
  rows = defaultRecent,
}: {
  rows?: RecentAnalysisRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Analysis</CardTitle>
        <CardDescription>Latest stock forecasts and trends</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Last Close</TableHead>
              <TableHead>Forecast Trend</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.ticker}>
                <TableCell className="font-medium">{item.ticker}</TableCell>
                <TableCell>{item.company}</TableCell>
                <TableCell>{item.close}</TableCell>
                <TableCell>
                  <Badge variant={getTrendBadgeVariant(item.trend)}>
                    {item.trend}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.updated}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/stock/${tickerToPath(item.ticker)}`}>
                    <Button variant="outline" size="sm">
                      View Analysis
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
