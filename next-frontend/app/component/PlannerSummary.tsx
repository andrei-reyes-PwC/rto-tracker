"use client";

import { CalendarClock, CalendarDays, MapPin, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchedule } from "@/app/component/ScheduleProvider";

export default function PlannerSummary() {
  const { officeDays, weekdayCount, monthLabel, nextOfficeDay, visibleEvents, isLoadingMonth,
    schedulingMode, dailyCapacity, loadError } = useSchedule();
  const modeDescription = schedulingMode === "PEZA"
    ? dailyCapacity !== null
      ? "Up to 50% of your platform per day. Badges show booked / capacity; save to reserve a slot."
      : "Platforms have a daily 50% attendance limit, rounded up. You have no platform assigned, so this limit does not apply."
    : "Choose your office days with no daily platform attendance limit.";
  const officeDayCount = officeDays.length;
  const nextEvent = visibleEvents[0] ?? null;
  const sameDayEvents = nextEvent
    ? visibleEvents.filter((event) => event.date.toDateString() === nextEvent.date.toDateString())
    : [];
  const nextEventDate = nextEvent
    ? new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(nextEvent.date)
    : null;
  const eventTitlePreview = sameDayEvents.length > 1 ? sameDayEvents.slice(0, 2) : [];

  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="h-full gap-0 border-slate-200/80 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2"><CardDescription>Current scheduling mode</CardDescription><span className="shrink-0 rounded-md bg-amber-50 p-2 text-amber-600"><Settings className="size-4" /></span></CardHeader>
        <CardContent>{isLoadingMonth ? <div role="status" aria-label="Loading scheduling mode" aria-busy="true" className="space-y-2"><Skeleton className="h-7 w-36" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /></div> : <><p className="text-2xl font-semibold">{loadError ? "Unavailable" : schedulingMode === "PEZA" ? "PEZA" : "Flexible"}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{loadError ? "Reload your schedule to see its current rules." : modeDescription}</p></>}</CardContent>
      </Card>
      <Card className="h-full gap-0 border-slate-200/80 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2"><CardDescription>Planned office days</CardDescription><span className="rounded-md bg-[#fff0e6] p-2 text-[#c74600]"><CalendarDays className="size-4" /></span></CardHeader>
        <CardContent>{isLoadingMonth ? <div role="status" aria-label="Loading schedule summary" className="space-y-2"><Skeleton className="h-7 w-36" /><Skeleton className="h-3 w-24" /></div> : <><p className="text-2xl font-semibold">{officeDayCount} <span className="text-sm font-normal text-slate-400">days in {monthLabel}</span></p><p className="mt-1 text-xs text-slate-500">{weekdayCount} fall on weekdays</p></>}</CardContent>
      </Card>
      <Card className="h-full gap-0 border-slate-200/80 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2"><CardDescription>Next office day</CardDescription><span className="rounded-md bg-emerald-50 p-2 text-emerald-600"><MapPin className="size-4" /></span></CardHeader>
        <CardContent>{isLoadingMonth ? <div role="status" aria-label="Loading next office day" className="space-y-2"><Skeleton className="h-7 w-36" /><Skeleton className="h-3 w-28" /></div> : <><p className="text-2xl font-semibold">{nextOfficeDay ? new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(nextOfficeDay) : "Not planned"}</p><p className="mt-1 text-xs text-slate-500">{nextOfficeDay ? "You're scheduled to be in" : "Select a day on the calendar"}</p></>}</CardContent>
      </Card>
      <Card className="h-full gap-0 border-slate-200/80 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2"><CardDescription>{sameDayEvents.length > 1 ? "Next events" : "Next event"}</CardDescription><span className="rounded-md bg-violet-50 p-2 text-violet-600"><CalendarClock className="size-4" /></span></CardHeader>
        <CardContent>{isLoadingMonth ? <div role="status" aria-label="Loading next event" className="space-y-2"><Skeleton className="h-7 w-36" /><Skeleton className="h-3 w-28" /></div> : <><p className="break-words text-lg font-semibold [overflow-wrap:anywhere]">{sameDayEvents.length > 1 ? `${sameDayEvents.length} events` : nextEvent?.title ?? "No upcoming events"}</p><p className="mt-1 text-xs text-slate-500">{nextEventDate ?? "No more events this month"}</p>{eventTitlePreview.length > 0 && <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-slate-500"><span className="min-w-0 truncate">{eventTitlePreview.map((event) => event.title).join(" · ")}</span>{sameDayEvents.length > 2 && <span className="shrink-0">+{sameDayEvents.length - 2} more</span>}</p>}</>}</CardContent>
      </Card>
    </div>
  );
}
