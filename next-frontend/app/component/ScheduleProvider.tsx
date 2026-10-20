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
import type { PlannerEvent } from "@/app/component/EventsRequirements";
import { useAuth } from "@/providers/AuthProvider";

type ScheduleContextValue = {
  hasUnsavedChanges: boolean;
  isLoadingMonth: boolean;
  isSaving: boolean;
  loadError: string;
  saveError: string;
  officeDays: string[];
  weekdayCount: number;
  monthLabel: string;
  monthName: string;
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
  const [isLoadingMonth, setIsLoadingMonth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loadRetry, setLoadRetry] = useState(0);
  const loadedMonths = useRef(new Set<string>());
  const previousUser = useRef<typeof user>(null);
  const currentDateKey = useSyncExternalStore(
    subscribeToCurrentDate,
    readClientDateSnapshot,
    () => serverDateSnapshot,
  );

  const monthSelection = visibleMonthOverride ?? currentDateKey;
  const [selectedYear, selectedMonthNumber] = monthSelection.split("-").map(Number);
  const visibleMonth = new Date(selectedYear, selectedMonthNumber - 1, 1);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthKey = getMonthKey(year, month);
  const officeDays = draftByMonth[monthKey] ?? savedByMonth[monthKey] ?? [];
  const hasUnsavedChanges = draftByMonth[monthKey] !== undefined;
  const today = new Date(`${currentDateKey}T12:00:00`);
  const todayKey = dateKey(today);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long" }).format(visibleMonth);
  const monthName = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(visibleMonth);

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

    let isCurrentRequest = true;
    setIsLoadingMonth(true);
    setLoadError("");

    getOfficeDays(monthKey)
      .then((schedule) => {
        if (!isCurrentRequest) return;
        loadedMonths.current.add(monthKey);
        setSavedByMonth((current) => ({ ...current, [monthKey]: schedule.officeDays }));
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest) return;
        setLoadError(error instanceof Error ? error.message : "Could not load this month's schedule.");
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoadingMonth(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [isAuthLoading, loadRetry, monthKey, user]);

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

  const allMonthEvents: PlannerEvent[] = [
    { date: new Date(year, month, 6), title: "Monthly all hands", kind: "Company event", time: "10:00 AM", place: "Town Hall", icon: Users, tone: "bg-violet-50 text-violet-700", required: false },
    { date: new Date(year, month, 12), title: "Team collaboration day", kind: "Mandatory RTO", time: "All day", place: "Manila office", icon: Building2, tone: "bg-rose-50 text-rose-700", required: true },
    { date: new Date(year, month, 19), title: "Product & design meetup", kind: "Team event", time: "2:00 PM", place: "Level 18", icon: Coffee, tone: "bg-amber-50 text-amber-700", required: false },
  ];
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
    setVisibleMonthOverride(getMonthKey(nextMonth.getFullYear(), nextMonth.getMonth()));
  }, [year, month]);

  const goToToday = useCallback(() => setVisibleMonthOverride(null), []);
  const retryLoading = useCallback(() => setLoadRetry((attempt) => attempt + 1), []);

  const value: ScheduleContextValue = {
    hasUnsavedChanges,
    isLoadingMonth,
    isSaving,
    loadError,
    saveError,
    officeDays,
    weekdayCount,
    monthLabel,
    monthName,
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
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) throw new Error("useSchedule must be used within a ScheduleProvider.");
  return context;
}
