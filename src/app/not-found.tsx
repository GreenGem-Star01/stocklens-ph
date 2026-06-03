import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="max-w-md text-muted-foreground">
          The page or stock ticker you requested does not exist. Try a supported
          ticker such as BDO.PS, SM.PS, or AAA.PS (full PSE directory).
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
