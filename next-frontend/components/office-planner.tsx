"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Clock3,
  Coffee,
  MapPin,
  Menu,
  Users,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const storageKey = "roamly-office-days";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function OfficePlanner() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  });
  const [savedByMonth, setSavedByMonth] = useState<Record<string, string[]>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<
          string,
          string[]
        >;
      } catch {
        return {};
      }
    },
  );

  const activeMonth = visibleMonth;
  const today = new Date();
  const monthKey = getMonthKey(
    activeMonth.getFullYear(),
    activeMonth.getMonth(),
  );
  const officeDays = savedByMonth[monthKey] ?? [];

  const year = activeMonth.getFullYear();
  const month = activeMonth.getMonth();
  const todayKey = today ? dateKey(today) : "";

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const sundayOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array.from({ length: sundayOffset }, () => null),
      ...Array.from(
        { length: daysInMonth },
        (_, index) => new Date(year, month, index + 1),
      ),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const monthName = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(activeMonth);
  const plannedDates = officeDays
    .map((key) => new Date(`${key}T12:00:00`))
    .sort((a, b) => a.getTime() - b.getTime());
  const weekdayCount = plannedDates.filter(
    (date) => date.getDay() !== 0 && date.getDay() !== 6,
  ).length;
  const upcomingDates = plannedDates
    .filter((date) => dateKey(date) >= todayKey)
    .slice(0, 4);
  const monthEvents = [
    {
      day: 6,
      title: "Monthly all hands",
      kind: "Company event",
      time: "10:00 AM",
      place: "Town Hall",
      icon: Users,
      tone: "bg-violet-50 text-violet-700",
      required: false,
    },
    {
      day: 12,
      title: "Team collaboration day",
      kind: "Mandatory RTO",
      time: "All day",
      place: "Singapore office",
      icon: Building2,
      tone: "bg-rose-50 text-rose-700",
      required: true,
    },
    {
      day: 19,
      title: "Product & design meetup",
      kind: "Team event",
      time: "2:00 PM",
      place: "Level 18",
      icon: Coffee,
      tone: "bg-amber-50 text-amber-700",
      required: false,
    },
  ].map((event) => ({ ...event, date: new Date(year, month, event.day) }));
  const visibleEvents = monthEvents.filter(
    (event) =>
      event.date.getMonth() === month &&
      event.date.getFullYear() === year &&
      dateKey(event.date) >= todayKey,
  );

  function toggleDay(key: string) {
    setHasUnsavedChanges(true);
    setSavedByMonth((current) => {
      const days = current[monthKey] ?? [];
      const updated = days.includes(key)
        ? days.filter((day) => day !== key)
        : [...days, key].sort();
      const next = { ...current, [monthKey]: updated };
      return next;
    });
  }

  function setWeekdays(checked: boolean) {
    setHasUnsavedChanges(true);
    const weekdayKeys = calendarDays.flatMap((date) =>
      date && date.getDay() !== 0 && date.getDay() !== 6 ? [dateKey(date)] : [],
    );
    setSavedByMonth((current) => {
      const days = current[monthKey] ?? [];
      const updated = checked
        ? [...new Set([...days, ...weekdayKeys])].sort()
        : days.filter((day) => !weekdayKeys.includes(day));
      const next = { ...current, [monthKey]: updated };
      return next;
    });
  }

  function changeMonth(offset: number) {
    setVisibleMonth(new Date(year, month + offset, 1));
  }

  function goToToday() {
    if (today)
      setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  function resetMonth() {
    setHasUnsavedChanges(true);
    setSavedByMonth((current) => {
      const next = { ...current, [monthKey]: [] };
      return next;
    });
  }

  function saveSchedule() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedByMonth));
      setHasUnsavedChanges(false);
    } catch {
      setHasUnsavedChanges(true);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f4] text-[#2d2926]">
      <div className="flex min-h-screen w-full lg:h-screen lg:min-h-0 lg:overflow-hidden">
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 self-start border-r border-slate-200/80 bg-white py-6 transition-[width,padding] duration-200 lg:flex lg:flex-col ${sidebarCollapsed ? "w-[76px] px-3" : "w-[238px] px-5"}`}
        >
          <div
            className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"}`}
          >
            <a
              href="#calendar"
              className={`flex items-center gap-3 ${sidebarCollapsed ? "px-0" : "px-1"}`}
              aria-label="PwC RTO planner home"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e65300] text-xs font-bold text-white">
                PwC
              </span>
              {!sidebarCollapsed && (
                <span className="text-[15px] font-semibold tracking-tight">
                  AC Manila
                </span>
              )}
            </a>
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Collapse navigation"
                onClick={() => setSidebarCollapsed(true)}
              >
                <ChevronsLeft className="size-4" />
              </Button>
            )}
          </div>
          {sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Expand navigation"
              onClick={() => setSidebarCollapsed(false)}
              className="mx-auto mt-5"
            >
              <ChevronsRight className="size-4" />
            </Button>
          )}
          <div className="mt-10">
            {!sidebarCollapsed && (
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Workspace
              </p>
            )}
            <nav aria-label="Workspace" className="mt-3 space-y-1 text-sm">
              <a
                href="#calendar"
                title={sidebarCollapsed ? "My schedule" : undefined}
                aria-label="My schedule"
                className={`flex items-center gap-3 rounded-lg py-2.5 font-medium ${sidebarCollapsed ? "justify-center px-0" : "px-3"} bg-[#fff0e6] text-[#b83b00]`}
              >
                <CalendarDays className="size-4 shrink-0" />{" "}
                {!sidebarCollapsed && "My schedule"}
              </a>
            </nav>
          </div>
          <div className={`mt-auto flex items-center border-t border-slate-200 pt-4 ${sidebarCollapsed ? "justify-center" : "gap-3 px-2"}`}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ffe0cc] text-xs font-semibold text-[#b83b00]">AR</div>
            {!sidebarCollapsed && <span className="text-sm font-medium text-slate-700">My profile</span>}
          </div>
        </aside>

        {mobileNavOpen && (
          <button
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200 bg-white px-5 py-6 shadow-xl transition-transform duration-200 lg:hidden ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}
          aria-label="Mobile navigation"
          aria-hidden={!mobileNavOpen}
        >
          <div className="flex items-center justify-between">
            <a
              href="#calendar"
              className="flex items-center gap-3"
              onClick={() => setMobileNavOpen(false)}
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#e65300] text-xs font-bold text-white">
                PwC
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                People &amp; Workplace
              </span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
          <div className="mt-10">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Workspace
            </p>
            <nav aria-label="Workspace" className="mt-3 space-y-1 text-sm">
              <a
                href="#calendar"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 rounded-lg bg-[#fff0e6] px-3 py-2.5 font-medium text-[#b83b00]"
              >
                <CalendarDays className="size-4" /> My schedule
              </a>
            </nav>
          </div>
          <div className="mt-auto flex items-center gap-3 border-t border-slate-200 px-2 pt-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ffe0cc] text-xs font-semibold text-[#b83b00]">AR</div>
            <span className="text-sm font-medium text-slate-700">My profile</span>
          </div>
        </aside>

        <section className="min-h-0 min-w-0 flex-1 lg:h-screen lg:overflow-y-auto">
          <div className="w-full space-y-7 px-5 py-8 sm:px-8 sm:py-10 lg:px-10 xl:px-12">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <Button
                  variant="outline"
                  className="mb-3 h-9 gap-2 border-slate-300 bg-white px-3 text-slate-700 shadow-sm lg:hidden"
                  aria-label="Open navigation menu"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <Menu className="size-4" /> Menu
                </Button>
                <p className="text-xs font-medium uppercase tracking-wide text-[#c74600]">
                  Workplace planner
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">
                  Plan your office days
                </h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  Choose the days you're heading in. Your schedule is saved on
                  this device.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                <span
                  aria-live="polite"
                  className="text-xs font-medium text-slate-500"
                >
                  {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
                </span>
                <Button
                  onClick={saveSchedule}
                  className="gap-2 bg-[#e65300] text-white shadow-sm hover:bg-[#c74600]"
                >
                  <Save className="size-4" /> Save schedule
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="gap-0 border-slate-200/80 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2">
                  <CardDescription>Planned office days</CardDescription>
                  <span className="rounded-md bg-[#fff0e6] p-2 text-[#c74600]">
                    <CalendarDays className="size-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {officeDays.length}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      days in{" "}
                      {new Intl.DateTimeFormat("en", { month: "long" }).format(
                        activeMonth,
                      )}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {weekdayCount} fall on weekdays
                  </p>
                </CardContent>
              </Card>
              <Card className="gap-0 border-slate-200/80 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2">
                  <CardDescription>Next office day</CardDescription>
                  <span className="rounded-md bg-emerald-50 p-2 text-emerald-600">
                    <MapPin className="size-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {upcomingDates[0]
                      ? new Intl.DateTimeFormat("en", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }).format(upcomingDates[0])
                      : "Not planned"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {upcomingDates[0]
                      ? "YouÃ¢â‚¬â„¢re scheduled to be in"
                      : "Select a day on the calendar"}
                  </p>
                </CardContent>
              </Card>
              <Card className="gap-0 border-slate-200/80 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2">
                  <CardDescription>Planning tip</CardDescription>
                  <span className="rounded-md bg-amber-50 p-2 text-amber-600">
                    <Sparkles className="size-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold">Coordinate your days</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Pick shared office days for team time and meetings.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
              <Card
                id="calendar"
                className="gap-0 border-slate-200/80 shadow-none"
              >
                <CardHeader className="flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-center">
                  <div>
                    <CardTitle className="text-base">
                      Monthly calendar
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Check a date to mark it as an office day
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Previous month"
                      onClick={() => changeMonth(-1)}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <p className="min-w-36 text-center text-sm font-semibold">
                      {monthName}
                    </p>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Next month"
                      onClick={() => changeMonth(1)}
                    >
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-1"
                      onClick={goToToday}
                    >
                      Today
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 border-b border-slate-200 pb-2">
                    {weekdays.map((day) => (
                      <div
                        key={day}
                        className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {calendarDays.map((date, index) => {
                      if (!date)
                        return (
                          <div
                            key={`blank-${index}`}
                            className="min-h-[78px] border-b border-r border-slate-100 bg-slate-50/50 sm:min-h-[112px]"
                          />
                        );
                      const key = dateKey(date);
                      const isOfficeDay = officeDays.includes(key);
                      const isToday = key === todayKey;
                      const isWeekend =
                        date.getDay() === 0 || date.getDay() === 6;
                      const event = monthEvents.find(
                        (item) => dateKey(item.date) === key,
                      );
                      return (
                        <label
                          key={key}
                          className={`group relative flex min-h-[78px] cursor-pointer flex-col border-b border-r border-slate-100 p-2 transition sm:min-h-[112px] sm:p-3 ${isOfficeDay ? "bg-[#fff0e6]/70 hover:bg-[#fff0e6]" : "bg-white hover:bg-slate-50"} ${isWeekend ? "bg-slate-50/40" : ""}`}
                        >
                          <span className="flex items-center justify-between">
                            <span
                              className={`flex size-7 items-center justify-center rounded-full text-xs ${isToday ? "bg-[#e65300] font-semibold text-white" : "font-medium text-slate-700"}`}
                            >
                              {date.getDate()}
                            </span>
                            <input
                              type="checkbox"
                              aria-label={`Mark ${new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date)} as an office day`}
                              checked={isOfficeDay}
                              onChange={() => toggleDay(key)}
                              className="size-4 cursor-pointer accent-[#e65300]"
                            />
                          </span>
                          <span
                            className={`mt-auto flex items-center gap-1 text-[10px] font-medium sm:text-xs ${isOfficeDay ? "text-[#b83b00]" : "text-slate-300 group-hover:text-slate-400"}`}
                          >
                            {isOfficeDay ? (
                              <>
                                <MapPin className="size-3" /> Office
                              </>
                            ) : event?.required ? (
                              <>
                                <Building2 className="size-3" /> Required
                              </>
                            ) : event ? (
                              <>
                                <CalendarDays className="size-3" /> Event
                              </>
                            ) : (
                              <span className="opacity-0 group-hover:opacity-100">
                                + Add plan
                              </span>
                            )}
                          </span>
                          {isToday && (
                            <span className="absolute bottom-2 right-2 text-[9px] font-semibold uppercase tracking-wide text-[#c74600] sm:bottom-3 sm:right-3">
                              Today
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-2">
                        <span className="size-3 rounded-sm border border-orange-200 bg-[#ffe0cc]" />{" "}
                        Office day
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-[#e65300]" />{" "}
                        Today
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 self-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWeekdays(true)}
                        className="gap-2"
                      >
                        <Check className="size-3.5" /> Select all remaining
                        weekdays
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetMonth}
                        disabled={officeDays.length === 0}
                        className="gap-2"
                      >
                        <RotateCcw className="size-3.5" /> Clear month
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                id="events"
                className="gap-0 border-slate-200/80 shadow-none"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-5">
                  <div>
                    <CardTitle className="text-base">
                      Events & office requirements
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Keep these in mind while planning{" "}
                      {new Intl.DateTimeFormat("en", { month: "long" }).format(
                        activeMonth,
                      )}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-rose-50 text-rose-700"
                  >
                    {visibleEvents.filter((event) => event.required).length}{" "}
                    mandatory
                  </Badge>
                </CardHeader>
                <CardContent>
                  {visibleEvents.length ? (
                    <div className="space-y-2">
                      {visibleEvents.map((event) => {
                        const Icon = event.icon;
                        return (
                          <div
                            key={event.title}
                            className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-start ${event.required ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"}`}
                          >
                            <div
                              className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${event.tone}`}
                            >
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold">
                                  {event.title}
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                {new Intl.DateTimeFormat("en", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }).format(event.date)}{" "}
                                | {event.time} | {event.place}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                              <Badge
                                variant={event.required ? "destructive" : "outline"}
                                className="h-5"
                              >
                                {event.kind}
                              </Badge>
                              {event.required && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
                                  <Building2 className="size-3.5" /> Required in
                                  office
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
                      <CircleHelp className="mt-0.5 size-4 shrink-0 text-slate-400" />
                      <p className="text-sm text-slate-500">
                        No upcoming events or office requirements this month.
                      </p>
                    </div>
                  )}
                  <p className="mt-4 text-xs text-slate-400">
                    Example events for this planner. Connect your company
                    calendar to show real events and RTO requirements.
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="pb-3 text-center text-xs text-slate-400">
              Your schedule stays on this device until you connect a work
              account.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
