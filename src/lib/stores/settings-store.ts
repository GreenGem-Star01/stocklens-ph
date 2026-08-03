"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ThemeMode } from "@/lib/theme";

export type SettingsState = {
  defaultHorizon: string;
  preferredModel: string;
  showModelComparison: boolean;
  displayAiInsights: boolean;
  defaultTimeRange: string;
  autoRefresh: boolean;
  showDisclaimerBanners: boolean;
  theme: ThemeMode;
  setField: <K extends keyof Omit<SettingsState, "setField" | "reset" | "setAll">>(
    key: K,
    value: SettingsState[K] | string,
  ) => void;
  setAll: (values: Omit<SettingsState, "setField" | "reset" | "setAll">) => void;
  reset: () => void;
};

const defaults: Omit<SettingsState, "setField" | "reset" | "setAll"> = {
  defaultHorizon: "7d",
  // Naive Baseline, not LSTM — see forecastModelSchema in
  // lib/validation/ticker.ts for why.
  preferredModel: "naive",
  showModelComparison: true,
  displayAiInsights: true,
  defaultTimeRange: "30d",
  autoRefresh: true,
  showDisclaimerBanners: true,
  theme: "light",
};

type PersistedSettingsV1 = {
  darkMode?: boolean;
  theme?: ThemeMode;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setField: (key, value) => set({ [key]: value }),
      setAll: (values) => set(values),
      reset: () => set(defaults),
    }),
    {
      name: "stocklens-settings",
      version: 3,
      migrate: (persisted, version) => {
        const legacy = persisted as Partial<SettingsState> & PersistedSettingsV1;
        // Rebuild from known keys only — drops fields retired in v3
        // (forecastUpdates/priceAlerts/marketNews/currencyDisplay), which
        // had no consumer anywhere in the app and only misled users into
        // thinking they controlled real behavior.
        const state = { ...defaults };
        for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
          if (key in legacy && legacy[key] !== undefined) {
            (state as Record<string, unknown>)[key] = legacy[key];
          }
        }

        if (version < 2) {
          if (legacy.theme && ["light", "dark", "system"].includes(legacy.theme)) {
            state.theme = legacy.theme;
          } else if (typeof legacy.darkMode === "boolean") {
            state.theme = legacy.darkMode ? "dark" : "light";
          }
        }

        return state;
      },
    },
  ),
);
