"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Label } from "@/components/ui/label";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/stores/settings-store";
import type { ThemeMode } from "@/lib/theme";

const options: {
  value: ThemeMode;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "light",
    label: "Light",
    description: "Bright backgrounds and dark text",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dark backgrounds for low-light use",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Match your device appearance",
    icon: Monitor,
  },
];

export function ThemeModeSetting() {
  const theme = useSettingsStore((s) => s.theme);
  const setField = useSettingsStore((s) => s.setField);
  const { resolvedTheme } = useTheme();
  const mounted = useIsClient();

  const activeResolved =
    mounted && resolvedTheme === "dark" ? "Dark" : mounted ? "Light" : null;

  return (
    <div className="space-y-4">
      <div className="space-y-0.5">
        <Label>Color mode</Label>
        <p className="text-sm text-muted-foreground">
          Choose how StockLens PH looks. Other settings use the same theme.
          {activeResolved ? (
            <>
              {" "}
              You are currently viewing{" "}
              <span className="font-medium text-foreground">
                {activeResolved} mode
              </span>
              {theme === "system" ? " (from system)" : ""}.
            </>
          ) : null}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map(({ value, label, description, icon: Icon }) => {
          const selected = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setField("theme", value)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/40",
              )}
              aria-pressed={selected}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  selected ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden
              />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
