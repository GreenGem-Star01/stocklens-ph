import Link from "next/link";
import { ListPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function WatchlistEmpty() {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <ListPlus className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
        <CardTitle>Your watchlist is empty</CardTitle>
        <CardDescription>
          Track Philippine stocks you care about and jump to analysis quickly.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-8">
        <Link href="/dashboard">
          <Button>Find stocks on the dashboard</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
