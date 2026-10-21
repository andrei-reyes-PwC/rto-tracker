"use client";

import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchedule } from "@/app/component/ScheduleProvider";

export default function PlannerSummary() {
  const { officeDays, weekdayCount, monthLabel, nextOfficeDay, isLoadingMonth } = useSchedule();
  const officeDayCount = officeDays.length;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="gap-0 border-slate-200/80 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2"><CardDescription>Planned office days</CardDescription><span className="rounded-md bg-[#fff0e6] p-2 text-[#c74600]"><CalendarDays className="size-4" /></span></CardHeader>
        <CardContent>{isLoadingMonth ? <div role="status" aria-label="Loading schedule summary" className="space-y-2"><Skeleton className="h-7 w-36" /><Skeleton className="h-3 w-24" /></div> : <><p className="text-2xl font-semibold">{officeDayCount} <span className="text-sm font-normal text-slate-400">days in {monthLabel}</span></p><p className="mt-1 text-xs text-slate-500">{weekdayCount} fall on weekdays</p></>}</CardContent>
      </Card>
      <Card className="gap-0 border-slate-200/80 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2"><CardDescription>Next office day</CardDescription><span className="rounded-md bg-emerald-50 p-2 text-emerald-600"><MapPin className="size-4" /></span></CardHeader>
        <CardContent>{isLoadingMonth ? <div role="status" aria-label="Loading next office day" className="space-y-2"><Skeleton className="h-7 w-36" /><Skeleton className="h-3 w-28" /></div> : <><p className="text-2xl font-semibold">{nextOfficeDay ? new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(nextOfficeDay) : "Not planned"}</p><p className="mt-1 text-xs text-slate-500">{nextOfficeDay ? "You're scheduled to be in" : "Select a day on the calendar"}</p></>}</CardContent>
      </Card>
      <Card className="gap-0 border-slate-200/80 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2"><CardDescription>Planning tip</CardDescription><span className="rounded-md bg-amber-50 p-2 text-amber-600"><Sparkles className="size-4" /></span></CardHeader>
        <CardContent><p className="text-sm font-semibold">Coordinate your days</p><p className="mt-1 text-xs leading-relaxed text-slate-500">Pick shared office days for team time and meetings.</p></CardContent>
      </Card>
    </div>
  );
}
