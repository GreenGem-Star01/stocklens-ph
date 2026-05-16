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
import type { StockAnalysis } from "@/lib/types/stock-analysis";

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
              <TableHead>MAE</TableHead>
              <TableHead>RMSE</TableHead>
              <TableHead>MAPE</TableHead>
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
