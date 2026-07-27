export function LiveIndicator({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-trend-up ${className ?? ""}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-trend-up opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-trend-up" />
      </span>
      Live
    </span>
  );
}
