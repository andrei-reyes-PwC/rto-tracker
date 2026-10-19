import { Building2, CircleHelp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type PlannerEvent = {
  date: Date;
  title: string;
  kind: string;
  time: string;
  place: string;
  icon: LucideIcon;
  tone: string;
  required: boolean;
};

type EventsRequirementsProps = { events: PlannerEvent[]; monthLabel: string };

export default function EventsRequirements({ events, monthLabel }: EventsRequirementsProps) {
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
              const Icon = event.icon;
              return (
                <div key={event.title} className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-start ${event.required ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"}`}>
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${event.tone}`}><Icon className="size-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(event.date)} | {event.time} | {event.place}</p>
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
        <p className="mt-4 text-xs text-slate-400">Example events for this planner. Connect your company calendar to show real events and RTO requirements.</p>
      </CardContent>
    </Card>
  );
}
