"use client";

import { useState } from "react";
import { Building2, CircleHelp, Clock3, History, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  scope: "GLOBAL" | "PLATFORM";
  platformName: string | null;
};

function formatEventDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function EventsRequirements() {
  const { allMonthEvents, visibleEvents, monthLabel, todayKey } = useSchedule();
  const [pastEventsMonth, setPastEventsMonth] = useState<string | null>(null);
  const showPastEvents = pastEventsMonth === monthLabel;
  const chronologicalEvents = [...allMonthEvents].sort(
    (first, second) => first.date.getTime() - second.date.getTime() || first.id - second.id,
  );
  const pastEvents = chronologicalEvents.filter((event) => formatEventDate(event.date) < todayKey);
  const events = showPastEvents ? chronologicalEvents : visibleEvents;

  return (
    <Card id="events" className="gap-0 border-slate-200/80 shadow-none">
      <CardHeader className="flex flex-col items-start justify-between gap-3 pb-5 sm:flex-row">
        <div><CardTitle className="text-base">Events & office requirements</CardTitle><CardDescription className="mt-1">Keep these in mind while planning {monthLabel}</CardDescription></div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant="secondary" className="bg-rose-50 text-rose-700">{events.filter((event) => event.required).length} mandatory</Badge>
          {pastEvents.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPastEventsMonth(showPastEvents ? null : monthLabel)}
              aria-pressed={showPastEvents}
            >
              <History aria-hidden="true" />
              {showPastEvents ? "Hide past events" : `See past events (${pastEvents.length})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto overscroll-contain">
        {events.length ? (
          <div className="space-y-2">
            {events.map((event) => {
              const isToday = formatEventDate(event.date) === todayKey;
              return (
                <div key={event.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-start">
                  <time dateTime={formatEventDate(event.date)} className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-lg font-semibold tabular-nums ${isToday ? "bg-[#e65300] text-white ring-2 ring-[#e65300]/20" : "bg-slate-100 text-slate-700"}`}>{event.date.getDate()}</time>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold [overflow-wrap:anywhere]">{event.title}</p>
                    <div className="mt-1 space-y-1 text-xs text-slate-500">
                      <p className="flex min-w-0 items-center gap-1.5"><Clock3 className="size-3.5 shrink-0" /><span className="break-words [overflow-wrap:anywhere]">{event.time}</span></p>
                      <p className="flex min-w-0 items-center gap-1.5"><MapPin className="size-3.5 shrink-0" /><span className="break-words [overflow-wrap:anywhere]">{event.place}</span></p>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col items-start gap-1 sm:w-[42%] sm:shrink-0 sm:items-end">
                    <div className="flex min-w-0 max-w-full flex-wrap items-start gap-1.5 sm:justify-end xl:flex-col xl:items-end">
                      <Badge variant="secondary" className="h-auto min-w-0 max-w-full overflow-visible whitespace-normal break-words px-2 py-1 text-left leading-4 [overflow-wrap:anywhere]">
                        {event.scope === "GLOBAL" ? "Global" : event.platformName ?? "Your group"}
                      </Badge>
                      <Badge variant={event.required ? "destructive" : "outline"} className="h-auto min-w-0 max-w-full overflow-visible whitespace-normal break-words px-2 py-1 text-left leading-4 [overflow-wrap:anywhere]">{event.kind}</Badge>
                    </div>
                    {event.required && <span className="flex items-center gap-1.5 text-xs font-medium text-rose-700 sm:text-right"><Building2 className="size-3.5 shrink-0" /> Required in office</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4"><CircleHelp className="mt-0.5 size-4 shrink-0 text-slate-400" /><p className="text-sm text-slate-500">{pastEvents.length > 0 ? "No upcoming events this month. You can view past events above." : "No events or office requirements this month."}</p></div>
        )}
        <p className="mt-4 text-xs text-slate-400">Global events and events for your platform are shown here.</p>
      </CardContent>
    </Card>
  );
}
