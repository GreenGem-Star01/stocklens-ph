import { BRAND_NAME } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  size?: number;
  /** When true, exposes accessible name (e.g. standalone icon). */
  labeled?: boolean;
};

export function LogoMark({
  className,
  size = 32,
  labeled = false,
}: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0 text-brand-accent", className)}
      role={labeled ? "img" : undefined}
      aria-hidden={labeled ? undefined : true}
      aria-label={labeled ? BRAND_NAME : undefined}
    >
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M10 20 L14 14 L18 17 L22 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}
