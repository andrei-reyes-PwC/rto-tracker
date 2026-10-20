"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type CalendarEvent = { date: Date; required: boolean };

type MonthlyCalendarProps = {
  monthName: string;
  calendarDays: (Date | null)[];
  officeDays: string[];
  todayKey: string;
  events: CalendarEvent[];
  onToggleDay: (key: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectWeekdays: () => void;
  onClearMonth: () => void;
  disabled?: boolean;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function MonthlyCalendar({
  monthName,
  calendarDays,
  officeDays,
  todayKey,
  events,
  onToggleDay,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onSelectWeekdays,
  onClearMonth,
  disabled = false,
}: MonthlyCalendarProps) {
  return (
    <Card id="calendar" className="gap-0 border-slate-200/80 shadow-none">
      <CardHeader className="flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-center">
        <div><CardTitle className="text-base">Monthly calendar</CardTitle><CardDescription className="mt-1">Check a date to mark it as an office day</CardDescription></div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={onPreviousMonth}><ArrowLeft className="size-4" /></Button>
          <p className="min-w-36 text-center text-sm font-semibold">{monthName}</p>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={onNextMonth}><ArrowRight className="size-4" /></Button>
          <Button variant="outline" size="sm" className="ml-1" onClick={onToday}>Today</Button>
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
            const event = events.find((item) => dateKey(item.date) === key);
            return (
              <label key={key} className={`group relative flex min-h-[78px] cursor-pointer flex-col border-b border-r border-slate-100 p-2 transition sm:min-h-[112px] sm:p-3 ${isOfficeDay ? "bg-[#fff0e6]/70 hover:bg-[#fff0e6]" : "bg-white hover:bg-slate-50"} ${isWeekend ? "bg-slate-50/40" : ""}`}>
                <span className="flex items-center justify-between">
                  <span className={`flex size-7 items-center justify-center rounded-full text-xs ${isToday ? "bg-[#e65300] font-semibold text-white" : "font-medium text-slate-700"}`}>{date.getDate()}</span>
                  <input type="checkbox" aria-label={`Mark ${new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date)} as an office day`} checked={isOfficeDay} onChange={() => onToggleDay(key)} disabled={disabled} className="size-4 cursor-pointer accent-[#e65300]" />
                </span>
                <span className={`mt-auto flex items-center gap-1 text-[10px] font-medium sm:text-xs ${isOfficeDay ? "text-[#b83b00]" : "text-slate-300 group-hover:text-slate-400"}`}>
                  {isOfficeDay ? <><MapPin className="size-3" /> Office</> : event?.required ? <><Building2 className="size-3" /> Required</> : event ? <><CalendarDays className="size-3" /> Event</> : <span className="opacity-0 group-hover:opacity-100">+ Add plan</span>}
                </span>
                {isToday && <span className="absolute bottom-2 right-2 text-[9px] font-semibold uppercase tracking-wide text-[#c74600] sm:bottom-3 sm:right-3">Today</span>}
              </label>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-2"><span className="size-3 rounded-sm border border-orange-200 bg-[#ffe0cc]" /> Office day</span>
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-[#e65300]" /> Today</span>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <Button variant="outline" size="sm" onClick={onSelectWeekdays} disabled={disabled} className="gap-2"><Check className="size-3.5" /> Select all remaining weekdays</Button>
            <Button variant="outline" size="sm" onClick={onClearMonth} disabled={disabled || officeDays.length === 0} className="gap-2"><RotateCcw className="size-3.5" /> Clear month</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
