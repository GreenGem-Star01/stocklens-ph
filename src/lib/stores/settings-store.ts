"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ThemeMode } from "@/lib/theme";

export type SettingsState = {
  forecastUpdates: boolean;
  priceAlerts: boolean;
  marketNews: boolean;
  defaultHorizon: string;
  preferredModel: string;
  showModelComparison: boolean;
  displayAiInsights: boolean;
  defaultTimeRange: string;
  currencyDisplay: string;
  autoRefresh: boolean;
  showDisclaimerBanners: boolean;
  theme: ThemeMode;
  setField: <K extends keyof Omit<SettingsState, "setField" | "reset">>(
    key: K,
    value: SettingsState[K] | string,
  ) => void;
  reset: () => void;
};

const defaults: Omit<SettingsState, "setField" | "reset"> = {
  forecastUpdates: true,
  priceAlerts: true,
  marketNews: false,
  defaultHorizon: "7d",
  preferredModel: "lstm",
  showModelComparison: true,
  displayAiInsights: true,
  defaultTimeRange: "30d",
  currencyDisplay: "php",
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
      reset: () => set(defaults),
    }),
    {
      name: "stocklens-settings",
      version: 2,
      migrate: (persisted, version) => {
        const state = { ...defaults, ...(persisted as Partial<SettingsState>) };

        if (version < 2) {
          const legacy = persisted as PersistedSettingsV1;
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
