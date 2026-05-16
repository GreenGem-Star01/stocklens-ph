"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      version: 1,
    },
  ),
);
