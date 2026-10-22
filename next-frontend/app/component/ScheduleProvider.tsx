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
import { Building2, Coffee, Users } from "lucide-react";
import { getOfficeDays, replaceOfficeDays } from "@/api/office-days";
import { getCalendarEvents } from "@/api/events";
import type { PlannerEvent } from "@/app/component/EventsRequirements";
import { useAuth } from "@/providers/AuthProvider";

type ScheduleContextValue = {
  hasUnsavedChanges: boolean;
  isLoadingMonth: boolean;
  isSaving: boolean;
  loadError: string;
  saveError: string;
  officeDays: string[];
  platformAttendanceCounts: Record<string, number> | null;
  selectedPlatformDate: string | null;
  weekdayCount: number;
  monthLabel: string;
  monthName: string;
  isCurrentDateReady: boolean;
  nextOfficeDay: Date | null;
  calendarDays: (Date | null)[];
  todayKey: string;
  allMonthEvents: PlannerEvent[];
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

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [visibleMonthOverride, setVisibleMonthOverride] = useState<string | null>(null);
  const [savedByMonth, setSavedByMonth] = useState<Record<string, string[]>>({});
  const [draftByMonth, setDraftByMonth] = useState<Record<string, string[]>>({});
  const [platformAttendanceByMonth, setPlatformAttendanceByMonth] = useState<Record<string, Record<string, number>>>({});
  const [selectedPlatformDate, setSelectedPlatformDate] = useState<string | null>(null);
  const [isLoadingMonth, setIsLoadingMonth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [loadRetry, setLoadRetry] = useState(0);
  const loadedMonths = useRef(new Set<string>());
  const previousUser = useRef<typeof user>(null);
  const currentDateKey = useSyncExternalStore(
    subscribeToCurrentDate,
    readClientDateSnapshot,
    () => serverDateSnapshot,
  );
  const isCurrentDateReady = currentDateKey !== serverDateSnapshot;

  const monthSelection = visibleMonthOverride ?? currentDateKey;
  const [selectedYear, selectedMonthNumber] = monthSelection.split("-").map(Number);
  const visibleMonth = new Date(selectedYear, selectedMonthNumber - 1, 1);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthKey = getMonthKey(year, month);
  const officeDays = draftByMonth[monthKey] ?? savedByMonth[monthKey] ?? [];
  const platformAttendanceCounts = platformAttendanceByMonth[monthKey] ?? null;
  const hasUnsavedChanges = draftByMonth[monthKey] !== undefined;
  const today = new Date(`${currentDateKey}T12:00:00`);
  const todayKey = dateKey(today);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long" }).format(visibleMonth);
  const monthName = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(visibleMonth);

  useEffect(() => {
    if (selectedPlatformDate && !selectedPlatformDate.startsWith(`${monthKey}-`)) {
      setSelectedPlatformDate(null);
    }
  }, [monthKey, selectedPlatformDate]);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoadingMonth(true);
      return;
    }

    if (!user) {
      previousUser.current = null;
      loadedMonths.current.clear();
      setSavedByMonth({});
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
      setDraftByMonth({});
      setPlatformAttendanceByMonth({});
      setLoadError("");
      setSaveError("");
    } else if (userDataChanged) {
      loadedMonths.current.delete(monthKey);
    }

    if (monthKey === serverDateSnapshot) return;
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
        const counts = Object.fromEntries(schedule.platformAttendance.map((day) => [day.date, day.attendees]));
        setPlatformAttendanceByMonth((current) => ({ ...current, [monthKey]: counts }));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : "Could not load this month's schedule.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingMonth(false);
      });

    return () => controller.abort();
  }, [isAuthLoading, loadRetry, monthKey, user]);

  useEffect(() => {
    if (isAuthLoading || !user || monthKey === serverDateSnapshot) {
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
          icon: event.required ? Building2 : event.kind.toLowerCase().includes("team") ? Coffee : Users,
          tone: event.required ? "bg-rose-50 text-rose-700" : event.kind.toLowerCase().includes("team") ? "bg-amber-50 text-amber-700" : "bg-violet-50 text-violet-700",
        })));
      })
      .catch(() => { if (!controller.signal.aborted) setEvents([]); });
    return () => controller.abort();
  }, [isAuthLoading, monthKey, user]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const offset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const plannedDates = officeDays.map((key) => new Date(`${key}T12:00:00`)).sort((a, b) => a.getTime() - b.getTime());
  const weekdayCount = plannedDates.filter((date) => date.getDay() !== 0 && date.getDay() !== 6).length;
  const nextOfficeDay = plannedDates.find((date) => dateKey(date) >= todayKey) ?? null;

  const allMonthEvents = events;
  const visibleEvents = allMonthEvents.filter((event) => dateKey(event.date) >= todayKey);

  const updateOfficeDays = useCallback((update: (current: string[]) => string[]) => {
    setDraftByMonth((current) => ({
      ...current,
      [monthKey]: update(current[monthKey] ?? savedByMonth[monthKey] ?? []),
    }));
  }, [monthKey, savedByMonth]);

  const toggleDay = useCallback((key: string) => {
    updateOfficeDays((current) => current.includes(key) ? current.filter((day) => day !== key) : [...current, key].sort());
  }, [updateOfficeDays]);

  const setWeekdays = useCallback(() => {
    const weekdays = calendarDays.flatMap((date) => date && date.getDay() !== 0 && date.getDay() !== 6 ? [dateKey(date)] : []);
    updateOfficeDays((current) => [...new Set([...current, ...weekdays])].sort());
  }, [calendarDays, updateOfficeDays]);

  const clearMonth = useCallback(() => updateOfficeDays(() => []), [updateOfficeDays]);

  const saveSchedule = useCallback(async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const schedule = await replaceOfficeDays(monthKey, officeDays);
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
  }, [monthKey, officeDays]);

  const changeMonth = useCallback((offset: number) => {
    const nextMonth = new Date(year, month + offset, 1);
    setSelectedPlatformDate(null);
    setVisibleMonthOverride(getMonthKey(nextMonth.getFullYear(), nextMonth.getMonth()));
  }, [year, month]);

  const goToToday = useCallback(() => {
    setSelectedPlatformDate(null);
    setVisibleMonthOverride(null);
  }, []);
  const selectPlatformDate = useCallback((date: string) => setSelectedPlatformDate(date), []);
  const retryLoading = useCallback(() => setLoadRetry((attempt) => attempt + 1), []);

  const value: ScheduleContextValue = {
    hasUnsavedChanges,
    isLoadingMonth,
    isSaving,
    loadError,
    saveError,
    officeDays,
    platformAttendanceCounts,
    selectedPlatformDate,
    weekdayCount,
    monthLabel,
    monthName,
    isCurrentDateReady,
    nextOfficeDay,
    calendarDays,
    todayKey,
    allMonthEvents,
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
