"use client";

import { Building2, CircleHelp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchedule } from "@/app/component/ScheduleProvider";

export type PlannerEvent = {
  id: number;
  date: Date;
  title: string;
  kind: string;
  time: string;
  place: string;
  required: boolean;
};

function formatEventDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function EventsRequirements() {
  const { visibleEvents: events, monthLabel, todayKey } = useSchedule();

  return (
    <Card id="events" className="gap-0 border-slate-200/80 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-5">
        <div><CardTitle className="text-base">Events & office requirements</CardTitle><CardDescription className="mt-1">Keep these in mind while planning {monthLabel}</CardDescription></div>
        <Badge variant="secondary" className="bg-rose-50 text-rose-700">{events.filter((event) => event.required).length} mandatory</Badge>
      </CardHeader>
      <CardContent>
        {events.length ? (
          <div className="space-y-2">
            {events.map((event) => {
              const isToday = formatEventDate(event.date) === todayKey;
              return (
                <div key={event.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-start">
                  <time dateTime={formatEventDate(event.date)} className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-lg font-semibold tabular-nums ${isToday ? "bg-[#e65300] text-white ring-2 ring-[#e65300]/20" : "bg-slate-100 text-slate-700"}`}>{event.date.getDate()}</time>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{event.time} · {event.place}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                    <Badge variant={event.required ? "destructive" : "outline"} className="h-5">{event.kind}</Badge>
                    {event.required && <span className="flex items-center gap-1.5 text-xs font-medium text-rose-700"><Building2 className="size-3.5" /> Required in office</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4"><CircleHelp className="mt-0.5 size-4 shrink-0 text-slate-400" /><p className="text-sm text-slate-500">No upcoming events or office requirements this month.</p></div>
        )}
        <p className="mt-4 text-xs text-slate-400">Global events and events for your platform are shown here.</p>
      </CardContent>
    </Card>
  );
}
