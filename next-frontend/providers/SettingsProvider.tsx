"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSettings, updateGlobalSettings, updatePlatformSettings, type ManagementSettings, type SettingsInput } from "@/api/settings";

type SettingsContextValue = {
  data: ManagementSettings | null;
  loading: boolean;
  saving: boolean;
  loadError: string;
  saveError: string;
  notice: string;
  retry: () => void;
  dismissNotice: () => void;
  save: (platformId: number | null, input: SettingsInput) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ManagementSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getSettings(controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Could not load settings.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  async function save(platformId: number | null, input: SettingsInput) {
    setSaving(true);
    setSaveError("");
    setNotice("");
    try {
      if (platformId === null) {
        const global = await updateGlobalSettings({ saturdayDayOff: input.saturdayDayOff, sundayDayOff: input.sundayDayOff, schedulingMode: input.schedulingMode });
        setData((current) => current && ({ global, platforms: current.platforms.map((platform) =>
          platform.inheritGlobal ? { ...platform, effective: global } : platform) }));
      } else {
        const updated = await updatePlatformSettings(platformId, input);
        setData((current) => current && ({ ...current, platforms: current.platforms.map((platform) => platform.id === platformId ? updated : platform) }));
      }
      setNotice(`${platformId === null ? "Global" : "Platform"} settings saved. The rules apply when planners load or save their schedule.`);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not save settings.");
    } finally { setSaving(false); }
  }

  return <SettingsContext.Provider value={{ data, loading, saving, loadError, saveError, notice,
    retry: () => { setLoading(true); setLoadError(""); setAttempt((value) => value + 1); },
    dismissNotice: () => setNotice(""), save }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider.");
  return context;
}
