"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { deleteEvent, getManageEvents, saveEvent, type CalendarEvent, type EventInput } from "@/api/events";
import { getPlatformOptions, type PlatformOption } from "@/api/platforms";
import { useCrudSearch } from "@/hooks/use-crud-search";

type ContextValue = {
  events: CalendarEvent[]; platforms: PlatformOption[]; search: string; setSearch: (search: string) => void; eventDate: string; setEventDate: (date: string) => void; loading: boolean; error: string; notice: string;
  load: (search?: string, date?: string, signal?: AbortSignal) => Promise<void>; save: (input: EventInput, id?: number) => Promise<string | null>;
  remove: (event: CalendarEvent) => Promise<string | null>; setNotice: (notice: string) => void;
};
const Context = createContext<ContextValue | null>(null);

export function EventManagementProvider({ children, loadPlatformOptions }: { children: ReactNode; loadPlatformOptions: boolean }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [eventDate, setEventDate] = useState("");
  const { search, setSearch, debouncedSearch } = useCrudSearch();
  const load = useCallback(async (query = debouncedSearch, date = eventDate, signal?: AbortSignal) => {
    setLoading(true); setError("");
    try {
      const nextEvents = await getManageEvents(query, date || undefined, signal);
      if (!signal?.aborted) setEvents(nextEvents);
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Could not load events.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [debouncedSearch, eventDate]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void load(debouncedSearch, eventDate, controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load, debouncedSearch, eventDate]);
  useEffect(() => {
    if (!loadPlatformOptions) return;
    const controller = new AbortController();
    getPlatformOptions(controller.signal).then((options) => {
      if (!controller.signal.aborted) setPlatforms(options);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load platform options.");
    });
    return () => controller.abort();
  }, [loadPlatformOptions]);
  const save = useCallback(async (input: EventInput, id?: number) => {
    try {
      await saveEvent(input, id);
      setNotice(`“${input.title}” was ${id === undefined ? "created" : "updated"}.`);
      await load(debouncedSearch, eventDate); return null;
    } catch (cause) { return cause instanceof Error ? cause.message : "Could not save this event."; }
  }, [load, debouncedSearch, eventDate]);
  const remove = useCallback(async (event: CalendarEvent) => {
    try {
      await deleteEvent(event.id);
      setNotice(`“${event.title}” was deleted.`);
      await load(debouncedSearch, eventDate); return null;
    } catch (cause) { return cause instanceof Error ? cause.message : "Could not delete this event."; }
  }, [load, debouncedSearch, eventDate]);
  const value = useMemo(() => ({ events, platforms, search, setSearch, eventDate, setEventDate, loading, error, notice, load, save, remove, setNotice }), [events, platforms, search, setSearch, eventDate, loading, error, notice, load, save, remove]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useEventManagement() {
  const value = useContext(Context);
  if (!value) throw new Error("useEventManagement must be used within EventManagementProvider.");
  return value;
}
