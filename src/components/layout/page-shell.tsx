import { APP_PAGE_CLASS } from "@/lib/layout";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn(APP_PAGE_CLASS, className)}>{children}</section>;
}
