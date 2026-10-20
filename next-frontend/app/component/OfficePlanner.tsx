"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Building2, Coffee, Users } from "lucide-react";
import { getOfficeDays, replaceOfficeDays } from "@/api/office-days";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import EventsRequirements, { type PlannerEvent } from "@/app/component/EventsRequirements";
import MonthlyCalendar from "@/app/component/MonthlyCalendar";
import PlannerHeading from "@/app/component/PlannerHeading";
import PlannerSummary from "@/app/component/PlannerSummary";

const serverDateSnapshot = "2000-01-01";
let clientDateSnapshot: string | undefined;

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

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function OfficePlanner() {
  const [visibleMonthOverride, setVisibleMonthOverride] = useState<string | null>(null);
  const [savedByMonth, setSavedByMonth] = useState<Record<string, string[]>>({});
  const [draftByMonth, setDraftByMonth] = useState<Record<string, string[]>>({});
  const [isLoadingMonth, setIsLoadingMonth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loadRetry, setLoadRetry] = useState(0);
  const loadedMonths = useRef(new Set<string>());
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
    if (monthKey === serverDateSnapshot) return;
    if (loadedMonths.current.has(monthKey)) {
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
  }, [monthKey, loadRetry]);

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

  function updateOfficeDays(update: (current: string[]) => string[]) {
    setDraftByMonth((current) => ({
      ...current,
      [monthKey]: update(current[monthKey] ?? savedByMonth[monthKey] ?? []),
    }));
  }

  function toggleDay(key: string) {
    updateOfficeDays((current) => current.includes(key) ? current.filter((day) => day !== key) : [...current, key].sort());
  }

  function setWeekdays() {
    const weekdays = calendarDays.flatMap((date) => date && date.getDay() !== 0 && date.getDay() !== 6 ? [dateKey(date)] : []);
    updateOfficeDays((current) => [...new Set([...current, ...weekdays])].sort());
  }

  function clearMonth() {
    updateOfficeDays(() => []);
  }

  async function saveSchedule() {
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
  }

  function changeMonth(offset: number) {
    const nextMonth = new Date(year, month + offset, 1);
    setVisibleMonthOverride(getMonthKey(nextMonth.getFullYear(), nextMonth.getMonth()));
  }

  function goToToday() {
    setVisibleMonthOverride(null);
  }

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen className="min-h-screen bg-[#f7f6f4] text-[#2d2926] lg:h-screen lg:min-h-0">
        <Sidebar />
        <SidebarInset className="min-h-screen min-w-0 lg:h-screen lg:min-h-0 lg:overflow-y-auto">
          <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-10 xl:px-12">
            <SidebarTrigger className="size-9 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Toggle sidebar" />
            <h1 className="text-base font-semibold tracking-tight text-[#2d2926] sm:text-lg">My Schedule</h1>
          </header>
          <div className="w-full space-y-7 px-5 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-5 lg:px-10 xl:px-12">
            <PlannerHeading
              hasUnsavedChanges={hasUnsavedChanges}
              isLoading={isLoadingMonth}
              isSaving={isSaving}
              onSave={saveSchedule}
            />
            {(loadError || saveError) && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <span>{loadError || saveError}</span>
                {loadError && (
                  <Button variant="outline" size="sm" onClick={() => setLoadRetry((attempt) => attempt + 1)}>
                    Retry
                  </Button>
                )}
              </div>
            )}
            <PlannerSummary
              officeDayCount={officeDays.length}
              weekdayCount={weekdayCount}
              monthLabel={monthLabel}
              nextOfficeDay={nextOfficeDay}
            />
            <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
              <MonthlyCalendar
                monthName={monthName}
                calendarDays={calendarDays}
                officeDays={officeDays}
                todayKey={todayKey}
                events={allMonthEvents}
                onToggleDay={toggleDay}
                onPreviousMonth={() => changeMonth(-1)}
                onNextMonth={() => changeMonth(1)}
                onToday={goToToday}
                onSelectWeekdays={setWeekdays}
                onClearMonth={clearMonth}
                disabled={isLoadingMonth || Boolean(loadError) || isSaving}
              />
              <EventsRequirements events={visibleEvents} monthLabel={monthLabel} />
            </div>
            <p className="pb-3 text-center text-xs text-slate-400">
              Your office days are saved to your work account.
            </p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
