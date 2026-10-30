"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CalendarDays,
  Utensils,
  RotateCcw,
  Save,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useSchedule } from "@/app/component/ScheduleProvider";
import { useAuth } from "@/providers/AuthProvider";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function MonthlyCalendar() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    monthName,
    allMonthEvents,
    lunchProcurementDates,
    isCurrentDateReady,
    calendarWeekdays,
    calendarDays,
    officeDays,
    daysOff,
    dailyCapacity,
    canSelectDay,
    platformAttendanceCounts,
    selectedPlatformDate,
    todayKey,
    isLoadingMonth,
    isSaving,
    hasUnsavedChanges,
    saveSchedule,
    loadError,
    toggleDay,
    changeMonth,
    goToToday,
    setWeekdays,
    clearMonth,
    selectPlatformDate,
  } = useSchedule();
  const eventCounts = new Map<string, number>();
  for (const event of allMonthEvents) {
    const key = dateKey(event.date);
    eventCounts.set(key, (eventCounts.get(key) ?? 0) + 1);
  }
  const disabled = isLoadingMonth || Boolean(loadError) || isSaving;
  const status = isSaving ? "Saving schedule..." : hasUnsavedChanges ? "Unsaved changes" : "All changes saved";
  const calendarGridStyle = { gridTemplateColumns: `repeat(${calendarWeekdays.length}, minmax(0, 1fr))` };

  return (
    <Card id="calendar" className="gap-0 border-slate-200/80 shadow-none">
      <CardHeader className="flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-start">
        <div><CardTitle className="text-base">Monthly calendar</CardTitle><CardDescription className="mt-1">Click any date to see who else on your platform plans to be in. Use the checkbox to edit future office days; today and past days are locked.</CardDescription></div>
        <div className="flex shrink-0 flex-col gap-3 self-start sm:items-end sm:self-auto">
          <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => changeMonth(-1)}><ArrowLeft className="size-4" /></Button>
          <div className="min-w-36 text-center text-sm font-semibold">{isCurrentDateReady ? monthName : <Skeleton role="status" aria-label="Loading current month" className="mx-auto h-4 w-28" />}</div>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => changeMonth(1)}><ArrowRight className="size-4" /></Button>
          <Button variant="outline" size="sm" className="ml-1" onClick={goToToday}>Today</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            {isLoadingMonth ? <Skeleton role="status" aria-label="Loading schedule status" className="h-4 w-28" /> : <span aria-live="polite" className="text-xs font-medium text-slate-500">{status}</span>}
            <Button onClick={saveSchedule} disabled={!hasUnsavedChanges || isLoadingMonth || isSaving} className="gap-2 bg-[#e65300] text-white shadow-sm hover:bg-[#c74600]"><Save className="size-4" />{isSaving ? "Saving..." : "Save schedule"}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {daysOff.length > 0 && <p className="mb-3 text-xs text-slate-500">{daysOff.map((day) => day === 6 ? "Saturday" : "Sunday").join(" and ")} {daysOff.length === 1 ? "is" : "are"} excluded by your day-off settings.</p>}
        {dailyCapacity !== null && <p className="mb-3 text-xs text-slate-500">PEZA: {dailyCapacity} daily slots (50% of platform members, rounded up). Badges show booked / capacity, including your current selection. Full dates cannot accept new bookings. Save to reserve your slot.</p>}
        <div className="grid border-b border-slate-200 pb-2" style={calendarGridStyle}>
          {calendarWeekdays.map((day) => <div key={day} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">{weekdays[day]}</div>)}
        </div>
        {isLoadingMonth ? <div role="status" aria-label="Loading monthly schedule" aria-busy="true" className="grid" style={calendarGridStyle}>
  {calendarDays.map((date, index) => date ? (
    <div key={`loading-${index}`} className="flex min-h-[78px] flex-col border-b border-r border-slate-100 p-1 sm:min-h-[112px] sm:p-3">
      <div className="flex items-center justify-between">
        <Skeleton className="size-7 rounded-full" />
        <Skeleton className="size-4" />
      </div>
      {(isAuthLoading || user?.platform) && (
        <div aria-hidden="true" className="mt-auto inline-flex h-5 w-12 items-center rounded-full">
          <Skeleton className="h-full w-full rounded-full" />
        </div>
      )}
    </div>
  ) : (
    <div key={`blank-${index}`} className="min-h-[78px] border-b border-r border-slate-100 bg-slate-50/50 sm:min-h-[112px]" />
  ))}
          <span className="sr-only">Loading monthly schedule</span>
        </div> : <div className="grid" style={calendarGridStyle}>
          {calendarDays.map((date, index) => {
            if (!date) return <div key={`blank-${index}`} className="min-h-[78px] border-b border-r border-slate-100 bg-slate-50/50 sm:min-h-[112px]" />;
            const key = dateKey(date);
            const isOfficeDay = officeDays.includes(key);
            const isToday = key === todayKey;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const platformColleagues = platformAttendanceCounts?.[key] ?? 0;
            const booked = platformColleagues + (isOfficeDay ? 1 : 0);
            const isFull = dailyCapacity !== null && booked >= dailyCapacity;
            const attendanceLabel = dailyCapacity === null ? `${platformColleagues} colleagues planning an office day`
              : `${booked} / ${dailyCapacity} slots booked; ${Math.max(0, dailyCapacity - booked)} available${isFull ? "; full" : ""}. Includes your current selection.`;
            const eventCount = eventCounts.get(key) ?? 0;
            const hasLunchProcurement = lunchProcurementDates.includes(key);
            return (
              <div key={key} className={`group relative flex min-h-[78px] flex-col border-b border-r border-slate-100 p-1 transition sm:min-h-[112px] sm:p-3 ${isOfficeDay ? "bg-[#fff0e6]/70 hover:bg-[#fff0e6]" : "bg-white hover:bg-slate-50"} ${isWeekend ? "bg-slate-50/40" : ""} ${selectedPlatformDate === key ? "z-10 ring-2 ring-inset ring-[#e65300]" : ""}`}>
                {user?.platform && <button type="button" aria-label={`Show platform office plans for ${new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date)}`} aria-pressed={selectedPlatformDate === key} onClick={() => selectPlatformDate(key)} className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#e65300]"><span className="sr-only">View platform RTO plans</span></button>}
                <div className="pointer-events-none relative z-10 flex h-full flex-1 flex-col">
                  <span className="flex items-center justify-between gap-1">
                    <span className="flex min-w-0 items-center gap-1">
                      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${isToday ? "bg-[#e65300] font-semibold text-white" : "font-medium text-slate-700"}`}>{date.getDate()}</span>
                    </span>
                    <Checkbox aria-label={`Mark ${new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date)} as an office day`} checked={isOfficeDay} onCheckedChange={() => toggleDay(key)} disabled={disabled || key <= todayKey || (!isOfficeDay && !canSelectDay(key))} title={key <= todayKey ? "Today and past office days are locked" : !isOfficeDay && !canSelectDay(key) ? "PEZA daily capacity is full" : undefined} className="pointer-events-auto cursor-pointer data-checked:bg-[#e65300] data-checked:border-[#e65300]" />
                  </span>
                  {(user?.platform && platformAttendanceCounts || eventCount > 0 || hasLunchProcurement) && (
                    <span className="mt-auto flex flex-wrap items-start gap-1">
                      {user?.platform && platformAttendanceCounts && (dailyCapacity !== null || platformColleagues > 0) && (
                        <span aria-label={attendanceLabel} title={attendanceLabel} className={`inline-flex h-5 items-center gap-1 self-start whitespace-nowrap rounded-full px-0 text-[9px] font-semibold sm:px-1.5 ${isFull ? "bg-red-50 text-red-700" : booked > 0 ? "bg-orange-50 text-[#b83b00]" : "bg-slate-100 text-slate-500"}`}>
                          <Users className="size-3 shrink-0" />{dailyCapacity === null ? platformColleagues : `${booked} / ${dailyCapacity}`}
                        </span>
                      )}
                      {eventCount > 0 && <span title={eventCount + (eventCount === 1 ? " event" : " events")} aria-label={eventCount + (eventCount === 1 ? " event" : " events")} className="inline-flex h-5 items-center gap-0.5 rounded-full bg-violet-50 px-0 text-[9px] font-semibold text-violet-700 sm:px-1.5"><CalendarDays className="size-3" />{eventCount}</span>}
                      {hasLunchProcurement && <span title="Lunch procurement" aria-label="Lunch procurement" className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-50 text-[9px] font-semibold text-emerald-700 sm:h-5 sm:w-auto sm:gap-0.5 sm:px-1.5"><Utensils className="size-3" /><span className="sr-only sm:not-sr-only sm:inline">Lunch</span></span>}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>}
        <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-2"><span className="size-3 rounded-sm border border-orange-200 bg-[#ffe0cc]" /> Office day</span>
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-[#e65300]" /> Today</span>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <Button variant="outline" size="sm" onClick={setWeekdays} disabled={disabled} className="gap-2"><Check className="size-3.5" />{dailyCapacity === null ? "Select all remaining weekdays" : "Select available remaining weekdays"}</Button>
            <Button variant="outline" size="sm" onClick={clearMonth} disabled={disabled || !officeDays.some((day) => day > todayKey)} className="gap-2"><RotateCcw className="size-3.5" /> Clear future days</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
