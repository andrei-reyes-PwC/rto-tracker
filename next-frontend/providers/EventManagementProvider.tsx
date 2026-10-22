"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { deleteEvent, getManageEvents, saveEvent, type CalendarEvent, type EventInput } from "@/api/events";
import { getPlatformOptions, type PlatformOption } from "@/api/platforms";

type ContextValue = {
  events: CalendarEvent[]; platforms: PlatformOption[]; loading: boolean; error: string; notice: string;
  load: (signal?: AbortSignal) => Promise<void>; save: (input: EventInput, id?: number) => Promise<string | null>;
  remove: (event: CalendarEvent) => Promise<string | null>; setNotice: (notice: string) => void;
};
const Context = createContext<ContextValue | null>(null);

export function EventManagementProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError("");
    try {
      const [nextEvents, nextPlatforms] = await Promise.all([getManageEvents(signal), getPlatformOptions(signal)]);
      if (!signal?.aborted) { setEvents(nextEvents); setPlatforms(nextPlatforms); }
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Could not load events.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void load(controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load]);
  const save = useCallback(async (input: EventInput, id?: number) => {
    try {
      await saveEvent(input, id);
      setNotice(`“${input.title}” was ${id === undefined ? "created" : "updated"}.`);
      await load(); return null;
    } catch (cause) { return cause instanceof Error ? cause.message : "Could not save this event."; }
  }, [load]);
  const remove = useCallback(async (event: CalendarEvent) => {
    try {
      await deleteEvent(event.id);
      setNotice(`“${event.title}” was deleted.`);
      await load(); return null;
    } catch (cause) { return cause instanceof Error ? cause.message : "Could not delete this event."; }
  }, [load]);
  const value = useMemo(() => ({ events, platforms, loading, error, notice, load, save, remove, setNotice }), [events, platforms, loading, error, notice, load, save, remove]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useEventManagement() {
  const value = useContext(Context);
  if (!value) throw new Error("useEventManagement must be used within EventManagementProvider.");
  return value;
}
