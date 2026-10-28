"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getRtoDashboardSites, getWeeklyRtoSummary, type DashboardSiteOption, type WeeklyRtoSummary } from "@/api/rto-dashboard";

function toDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function mondayOf(date: Date) { const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate()); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); return toDateKey(monday); }
function addDays(dateKey: string, count: number) { const date = new Date(`${dateKey}T12:00:00`); date.setDate(date.getDate() + count); return toDateKey(date); }

type Value = { weekStart: string; siteFilter: string; setSiteFilter: (siteId: string) => void; sites: DashboardSiteOption[]; summary: WeeklyRtoSummary | null; loading: boolean; error: string; retry: () => void; previousWeek: () => void; nextWeek: () => void; currentWeek: () => void; addDays: (dateKey: string, count: number) => string };
const Context = createContext<Value | null>(null);

export function RtoDashboardProvider({ children }: { children: ReactNode }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [siteFilter, setSiteFilter] = useState("all");
  const [sites, setSites] = useState<DashboardSiteOption[]>([]);
  const [summary, setSummary] = useState<WeeklyRtoSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getRtoDashboardSites(controller.signal).then((result) => {
      if (!controller.signal.aborted) setSites(result);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load Site filter options.");
    });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true); setError("");
      getWeeklyRtoSummary(weekStart, siteFilter, controller.signal).then((result) => { if (!controller.signal.aborted) setSummary(result); }).catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load the RTO dashboard.");
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [weekStart, siteFilter, retryCount]);
  const retry = useCallback(() => setRetryCount((count) => count + 1), []);
  const previousWeek = useCallback(() => setWeekStart((current) => addDays(current, -7)), []);
  const nextWeek = useCallback(() => setWeekStart((current) => addDays(current, 7)), []);
  const currentWeek = useCallback(() => setWeekStart(mondayOf(new Date())), []);
  const value = useMemo(() => ({ weekStart, siteFilter, setSiteFilter, sites, summary, loading, error, retry, previousWeek, nextWeek, currentWeek, addDays }), [weekStart, siteFilter, sites, summary, loading, error, retry, previousWeek, nextWeek, currentWeek]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useRtoDashboard() {
  const value = useContext(Context);
  if (!value) throw new Error("useRtoDashboard must be used within RtoDashboardProvider.");
  return value;
}
