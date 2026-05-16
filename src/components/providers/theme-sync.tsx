"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

import { useSettingsStore } from "@/lib/stores/settings-store";

/**
 * Keeps next-themes in sync with persisted settings (source of truth).
 */
export function ThemeSync() {
  const theme = useSettingsStore((s) => s.theme);
  const { setTheme } = useTheme();

  useEffect(() => {
    const applyFromStore = () => {
      setTheme(useSettingsStore.getState().theme);
    };

    applyFromStore();

    const unsub = useSettingsStore.persist.onFinishHydration(() => {
      applyFromStore();
    });

    return unsub;
  }, [setTheme]);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
}
