"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchedule } from "@/app/component/ScheduleProvider";
import { useAuth } from "@/providers/AuthProvider";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function MonthlyCalendar() {
  const { user } = useAuth();
  const {
    monthName,
    calendarDays,
    officeDays,
    platformAttendanceCounts,
    selectedPlatformDate,
    todayKey,
    isLoadingMonth,
    isSaving,
    loadError,
    toggleDay,
    changeMonth,
    goToToday,
    setWeekdays,
    clearMonth,
    selectPlatformDate,
  } = useSchedule();
  const disabled = isLoadingMonth || Boolean(loadError) || isSaving;

  return (
    <Card id="calendar" className="gap-0 border-slate-200/80 shadow-none">
      <CardHeader className="flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-center">
        <div><CardTitle className="text-base">Monthly calendar</CardTitle><CardDescription className="mt-1">Click any date to see who else on your platform plans to be in. Use the checkbox to edit your own plan.</CardDescription></div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => changeMonth(-1)}><ArrowLeft className="size-4" /></Button>
          <p className="min-w-36 text-center text-sm font-semibold">{monthName}</p>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => changeMonth(1)}><ArrowRight className="size-4" /></Button>
          <Button variant="outline" size="sm" className="ml-1" onClick={goToToday}>Today</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 border-b border-slate-200 pb-2">
          {weekdays.map((day) => <div key={day} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            if (!date) return <div key={`blank-${index}`} className="min-h-[78px] border-b border-r border-slate-100 bg-slate-50/50 sm:min-h-[112px]" />;
            const key = dateKey(date);
            const isOfficeDay = officeDays.includes(key);
            const isToday = key === todayKey;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const platformColleagues = platformAttendanceCounts?.[key] ?? 0;
            return (
              <div key={key} className={`group relative flex min-h-[78px] flex-col border-b border-r border-slate-100 p-1 transition sm:min-h-[112px] sm:p-3 ${isOfficeDay ? "bg-[#fff0e6]/70 hover:bg-[#fff0e6]" : "bg-white hover:bg-slate-50"} ${isWeekend ? "bg-slate-50/40" : ""} ${selectedPlatformDate === key ? "z-10 ring-2 ring-inset ring-[#e65300]" : ""}`}>
                {user?.platform && <button type="button" aria-label={`Show platform office plans for ${new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date)}`} aria-pressed={selectedPlatformDate === key} onClick={() => selectPlatformDate(key)} className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#e65300]"><span className="sr-only">View platform RTO plans</span></button>}
                <div className="pointer-events-none relative z-10 flex h-full flex-1 flex-col">
                  <span className="flex items-center justify-between">
                    <span className={`flex size-7 items-center justify-center rounded-full text-xs ${isToday ? "bg-[#e65300] font-semibold text-white" : "font-medium text-slate-700"}`}>{date.getDate()}</span>
                    <input type="checkbox" aria-label={`Mark ${new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date)} as an office day`} checked={isOfficeDay} onChange={() => toggleDay(key)} disabled={disabled} className="pointer-events-auto size-4 cursor-pointer accent-[#e65300]" />
                  </span>
                  {user?.platform && platformAttendanceCounts && (
                    <span aria-label={`${platformColleagues} colleagues planning an office day`} title={`${platformColleagues} colleagues planning an office day`} className={`mt-auto inline-flex items-center gap-1 self-start rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${platformColleagues > 0 ? "bg-orange-50 text-[#b83b00]" : "bg-slate-100 text-slate-500"}`}>
                      <Users className="size-3" />{platformColleagues}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-2"><span className="size-3 rounded-sm border border-orange-200 bg-[#ffe0cc]" /> Office day</span>
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-[#e65300]" /> Today</span>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <Button variant="outline" size="sm" onClick={setWeekdays} disabled={disabled} className="gap-2"><Check className="size-3.5" /> Select all remaining weekdays</Button>
            <Button variant="outline" size="sm" onClick={clearMonth} disabled={disabled || officeDays.length === 0} className="gap-2"><RotateCcw className="size-3.5" /> Clear month</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
