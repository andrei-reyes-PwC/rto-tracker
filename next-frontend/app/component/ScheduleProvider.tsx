"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getOfficeDays, replaceOfficeDays } from "@/api/office-days";
import { getCalendarEvents } from "@/api/events";
import { getLunchProcurementDates } from "@/api/lunch";
import type { PlannerEvent } from "@/app/component/EventsRequirements";
import { useAuth } from "@/providers/AuthProvider";
import type { SchedulingMode } from "@/api/settings";
import { useSearchParams } from "next/navigation";

type ScheduleContextValue = {
  hasUnsavedChanges: boolean;
  isLoadingMonth: boolean;
  isSaving: boolean;
  loadError: string;
  saveError: string;
  officeDays: string[];
  daysOff: number[];
  schedulingMode: SchedulingMode;
  dailyCapacity: number | null;
  canSelectDay: (key: string) => boolean;
  platformAttendanceCounts: Record<string, number> | null;
  selectedPlatformDate: string | null;
  weekdayCount: number;
  monthLabel: string;
  monthName: string;
  isCurrentDateReady: boolean;
  nextOfficeDay: Date | null;
  calendarWeekdays: number[];
  calendarDays: (Date | null)[];
  todayKey: string;
  allMonthEvents: PlannerEvent[];
  lunchProcurementDates: string[];
  visibleEvents: PlannerEvent[];
  retryLoading: () => void;
  saveSchedule: () => Promise<void>;
  toggleDay: (key: string) => void;
  changeMonth: (offset: number) => void;
  goToToday: () => void;
  setWeekdays: () => void;
  clearMonth: () => void;
  selectPlatformDate: (date: string) => void;
};

const serverDateSnapshot = "2000-01-01";
const emptyOfficeDays: string[] = [];
const emptyDaysOff: number[] = [];
let clientDateSnapshot: string | undefined;

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readClientDateSnapshot() {
  const current = dateKey(new Date());
  if (clientDateSnapshot !== current) clientDateSnapshot = current;
  return clientDateSnapshot;
}

function subscribeToCurrentDate(onStoreChange: () => void) {
  const interval = window.setInterval(() => {
    const current = dateKey(new Date());
    if (clientDateSnapshot !== current) {
      clientDateSnapshot = current;
      onStoreChange();
    }
  }, 60_000);
  return () => window.clearInterval(interval);
}

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function isValidMonth(value: string | null): value is string {
  return value !== null && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value);
}

function updateMonthUrl(month: string) {
  if (!isValidMonth(month)) return;
  const url = new URL(window.location.href);
  url.searchParams.set("month", month);
  const path = `${url.pathname}${url.search}${url.hash}`;
  window.history.pushState(null, "", path);
}

function isDayOff(key: string, daysOff: number[]) {
  return daysOff.includes(new Date(`${key}T12:00:00`).getDay() || 7);
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();
  const requestedMonth = searchParams.get("month");
  const urlMonth = isValidMonth(requestedMonth) ? requestedMonth : null;
  const [savedByMonth, setSavedByMonth] = useState<Record<string, string[]>>({});
  const [draftByMonth, setDraftByMonth] = useState<Record<string, string[]>>({});
  const [daysOffByMonth, setDaysOffByMonth] = useState<Record<string, number[]>>({});
  const [planningByMonth, setPlanningByMonth] = useState<Record<string, { schedulingMode: SchedulingMode; dailyCapacity: number | null }>>({});
  const [platformAttendanceByMonth, setPlatformAttendanceByMonth] = useState<Record<string, Record<string, number>>>({});
  const [selectedPlatformDate, setSelectedPlatformDate] = useState<string | null>(null);
  const [isLoadingMonth, setIsLoadingMonth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [lunchProcurementDates, setLunchProcurementDates] = useState<string[]>([]);
  const [loadRetry, setLoadRetry] = useState(0);
  const loadedMonths = useRef(new Set<string>());
  const previousUser = useRef<typeof user>(null);
  const currentDateKey = useSyncExternalStore(
    subscribeToCurrentDate,
    readClientDateSnapshot,
    () => serverDateSnapshot,
  );
  const isCurrentDateReady = currentDateKey !== serverDateSnapshot;

  const monthSelection = urlMonth ?? currentDateKey;
  const [selectedYear, selectedMonthNumber] = monthSelection.split("-").map(Number);
  const visibleMonth = new Date(selectedYear, selectedMonthNumber - 1, 1);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthKey = getMonthKey(year, month);
  const allOfficeDays = draftByMonth[monthKey] ?? savedByMonth[monthKey] ?? emptyOfficeDays;
  const daysOff = daysOffByMonth[monthKey] ?? emptyDaysOff;
  const officeDays = useMemo(() => allOfficeDays.filter((key) => !isDayOff(key, daysOff)), [allOfficeDays, daysOff]);
  const platformAttendanceCounts = platformAttendanceByMonth[monthKey] ?? null;
  const schedulingMode = planningByMonth[monthKey]?.schedulingMode ?? "FLEXIBLE";
  const dailyCapacity = planningByMonth[monthKey]?.dailyCapacity ?? null;
  const savedOfficeDays = savedByMonth[monthKey] ?? emptyOfficeDays;
  const canSelectDay = useCallback((key: string) => dailyCapacity === null
    || savedOfficeDays.includes(key)
    || (platformAttendanceCounts?.[key] ?? 0) < dailyCapacity,
  [dailyCapacity, savedOfficeDays, platformAttendanceCounts]);
  const hasUnsavedChanges = draftByMonth[monthKey] !== undefined;
  const today = new Date(`${currentDateKey}T12:00:00`);
  const todayKey = dateKey(today);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long" }).format(visibleMonth);
  const monthName = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(visibleMonth);

  useEffect(() => {
    if (selectedPlatformDate && (!selectedPlatformDate.startsWith(`${monthKey}-`) || isDayOff(selectedPlatformDate, daysOff))) {
      setSelectedPlatformDate(null);
    }
  }, [monthKey, selectedPlatformDate, daysOff]);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoadingMonth(true);
      return;
    }

    if (!user) {
      previousUser.current = null;
      loadedMonths.current.clear();
      setSavedByMonth({});
      setDaysOffByMonth({});
      setPlanningByMonth({});
      setDraftByMonth({});
      setPlatformAttendanceByMonth({});
      setLoadError("");
      setSaveError("");
      setIsLoadingMonth(false);
      return;
    }

    const userDataChanged = previousUser.current !== user;
    const accountChanged = previousUser.current?.email !== user.email;
    previousUser.current = user;

    if (accountChanged) {
      loadedMonths.current.clear();
      setSavedByMonth({});
      setDaysOffByMonth({});
      setPlanningByMonth({});
      setDraftByMonth({});
      setPlatformAttendanceByMonth({});
      setLoadError("");
      setSaveError("");
    } else if (userDataChanged) {
      loadedMonths.current.delete(monthKey);
    }

    if (!isCurrentDateReady) return;
    if (!userDataChanged && loadedMonths.current.has(monthKey)) {
      setIsLoadingMonth(false);
      setLoadError("");
      return;
    }

    const controller = new AbortController();
    setIsLoadingMonth(true);
    setLoadError("");

    getOfficeDays(monthKey, controller.signal)
      .then((schedule) => {
        if (controller.signal.aborted) return;
        loadedMonths.current.add(monthKey);
        setSavedByMonth((current) => ({ ...current, [monthKey]: schedule.officeDays }));
        setDaysOffByMonth((current) => ({ ...current, [monthKey]: schedule.daysOff }));
        setPlanningByMonth((current) => ({ ...current, [monthKey]: { schedulingMode: schedule.schedulingMode, dailyCapacity: schedule.dailyCapacity } }));
        const counts = Object.fromEntries(schedule.platformAttendance.map((day) => [day.date, day.attendees]));
        setPlatformAttendanceByMonth((current) => ({ ...current, [monthKey]: counts }));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const cause = error instanceof Error ? error.message : "The server did not return schedule data.";
        setLoadError(`Could not load this month's RTO days and platform attendance counts. Calendar dates and counts may be missing until the schedule loads successfully. ${cause}`);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingMonth(false);
      });

    return () => controller.abort();
  }, [isAuthLoading, isCurrentDateReady, loadRetry, monthKey, user]);

  useEffect(() => {
    if (isAuthLoading || !user || !isCurrentDateReady) {
      setEvents([]);
      return;
    }
    const controller = new AbortController();
    getCalendarEvents(monthKey, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setEvents(result.map((event) => ({
          ...event,
          date: new Date(`${event.date}T12:00:00`),
        })));
      })
      .catch(() => { if (!controller.signal.aborted) setEvents([]); });
    return () => controller.abort();
  }, [isAuthLoading, isCurrentDateReady, monthKey, user]);

  useEffect(() => {
    if (isAuthLoading || !user || !isCurrentDateReady) {
      setLunchProcurementDates([]);
      return;
    }
    setLunchProcurementDates([]);
    const controller = new AbortController();
    getLunchProcurementDates(monthKey, controller.signal)
      .then((dates) => { if (!controller.signal.aborted) setLunchProcurementDates(dates); })
      .catch(() => { if (!controller.signal.aborted) setLunchProcurementDates([]); });
    return () => controller.abort();
  }, [isAuthLoading, isCurrentDateReady, monthKey, user]);

  const calendarWeekdays = useMemo(() => [0, 1, 2, 3, 4, 5, 6].filter((day) => !daysOff.includes(day || 7)), [daysOff]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const offset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const visibleCells: (Date | null)[] = [];
    for (let index = 0; index < cells.length; index += 7) {
      const week = cells.slice(index, index + 7).filter((_, weekday) => calendarWeekdays.includes(weekday));
      if (week.some((date) => date !== null)) visibleCells.push(...week);
    }
    return visibleCells;
  }, [year, month, calendarWeekdays]);

  const plannedDates = officeDays.map((key) => new Date(`${key}T12:00:00`)).sort((a, b) => a.getTime() - b.getTime());
  const weekdayCount = plannedDates.filter((date) => date.getDay() !== 0 && date.getDay() !== 6).length;
  const nextOfficeDay = plannedDates.find((date) => dateKey(date) >= todayKey) ?? null;

  const allMonthEvents = events;
  const visibleEvents = allMonthEvents
    .filter((event) => dateKey(event.date) >= todayKey)
    .sort((first, second) => first.date.getTime() - second.date.getTime() || first.id - second.id);

  const updateOfficeDays = useCallback((update: (current: string[]) => string[]) => {
    setDraftByMonth((current) => {
      const allDays = current[monthKey] ?? savedByMonth[monthKey] ?? [];
      const hiddenDays = (savedByMonth[monthKey] ?? []).filter((key) => isDayOff(key, daysOff));
      const visibleDays = allDays.filter((key) => !isDayOff(key, daysOff));
      return { ...current, [monthKey]: [...hiddenDays, ...update(visibleDays)].sort() };
    });
  }, [monthKey, savedByMonth, daysOff]);

  const toggleDay = useCallback((key: string) => {
    if (key <= todayKey || isLoadingMonth || loadError || isSaving) return;
    if (isDayOff(key, daysOff)) return;
    updateOfficeDays((current) => current.includes(key) ? current.filter((day) => day !== key) : canSelectDay(key) ? [...current, key].sort() : current);
  }, [todayKey, isLoadingMonth, loadError, isSaving, daysOff, updateOfficeDays, canSelectDay]);

  const setWeekdays = useCallback(() => {
    if (isLoadingMonth || loadError || isSaving) return;
    const weekdays = calendarDays.flatMap((date) => date && dateKey(date) > todayKey && date.getDay() !== 0 && date.getDay() !== 6 && canSelectDay(dateKey(date)) ? [dateKey(date)] : []);
    updateOfficeDays((current) => [...new Set([...current, ...weekdays])].sort());
  }, [calendarDays, todayKey, updateOfficeDays, canSelectDay, isLoadingMonth, loadError, isSaving]);

  const clearMonth = useCallback(() => updateOfficeDays((current) => current.filter((day) => day <= todayKey)), [todayKey, updateOfficeDays]);

  const saveSchedule = useCallback(async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const hiddenSavedDays = (savedByMonth[monthKey] ?? []).filter((key) => isDayOff(key, daysOff));
      const schedule = await replaceOfficeDays(monthKey, [...officeDays, ...hiddenSavedDays].sort());
      setSavedByMonth((current) => ({ ...current, [monthKey]: schedule.officeDays }));
      setDraftByMonth((current) => {
        const next = { ...current };
        delete next[monthKey];
        return next;
      });
      loadedMonths.current.add(monthKey);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not save this month's schedule.");
    } finally {
      setIsSaving(false);
    }
  }, [monthKey, officeDays, daysOff, savedByMonth]);

  const changeMonth = useCallback((offset: number) => {
    const nextMonth = new Date(year, month + offset, 1);
    setSelectedPlatformDate(null);
    updateMonthUrl(getMonthKey(nextMonth.getFullYear(), nextMonth.getMonth()));
  }, [year, month]);

  const goToToday = useCallback(() => {
    setSelectedPlatformDate(null);
    updateMonthUrl(currentDateKey.slice(0, 7));
  }, [currentDateKey]);
  const selectPlatformDate = useCallback((date: string) => {
    if (!isDayOff(date, daysOff)) setSelectedPlatformDate(date);
  }, [daysOff]);
  const retryLoading = useCallback(() => {
    loadedMonths.current.delete(monthKey);
    setLoadRetry((attempt) => attempt + 1);
  }, [monthKey]);

  const value: ScheduleContextValue = {
    hasUnsavedChanges,
    isLoadingMonth,
    isSaving,
    loadError,
    saveError,
    officeDays,
    daysOff,
    schedulingMode,
    dailyCapacity,
    canSelectDay,
    platformAttendanceCounts,
    selectedPlatformDate,
    weekdayCount,
    monthLabel,
    monthName,
    isCurrentDateReady,
    nextOfficeDay,
    calendarWeekdays,
    calendarDays,
    todayKey,
    allMonthEvents,
    lunchProcurementDates,
    visibleEvents,
    retryLoading,
    saveSchedule,
    toggleDay,
    changeMonth,
    goToToday,
    setWeekdays,
    clearMonth,
    selectPlatformDate,
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) throw new Error("useSchedule must be used within a ScheduleProvider.");
  return context;
}
