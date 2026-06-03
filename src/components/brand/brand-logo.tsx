import Link from "next/link";

import {
  BRAND_NAME,
  BRAND_SUFFIX,
} from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

import { LogoMark } from "./logo-mark";

export type BrandLogoProps = {
  showSuffix?: boolean;
  variant?: "full" | "mark";
  className?: string;
  href?: string;
  markSize?: number;
};

export function BrandLogo({
  showSuffix = true,
  variant = "full",
  className,
  href = "/",
  markSize = 28,
}: BrandLogoProps) {
  const linkClass = cn(
    "inline-flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className,
  );

  if (variant === "mark") {
    return (
      <Link href={href} className={linkClass}>
        <LogoMark size={markSize} labeled />
      </Link>
    );
  }

  return (
    <Link href={href} className={linkClass}>
      <LogoMark size={markSize} />
      <span className="font-semibold tracking-tight text-foreground">
        {BRAND_NAME}
      </span>
      {showSuffix ? (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          {BRAND_SUFFIX}
        </span>
      ) : null}
    </Link>
  );
}
