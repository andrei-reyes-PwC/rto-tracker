"use client";

import { RtoDashboardProvider, useRtoDashboard } from "@/providers/RtoDashboardProvider";
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { WeeklyRtoSummary } from "@/api/rto-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import DataLoadError from "@/components/DataLoadError";

function formatDate(dateKey: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(`${dateKey}T12:00:00`));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

export default function RtoDashboard() {
  return <RtoDashboardProvider><RtoDashboardContent /></RtoDashboardProvider>;
}

function RtoDashboardContent() {
  const { weekStart, summary, loading, error, retry, previousWeek, nextWeek, currentWeek, addDays } = useRtoDashboard();

  const weekLabel = summary
    ? `${formatDate(summary.weekStart, { month: "short", day: "numeric" })} – ${formatDate(summary.weekEnd, { month: "short", day: "numeric", year: "numeric" })}`
    : `${formatDate(weekStart, { month: "short", day: "numeric" })} – ${formatDate(addDays(weekStart, 4), { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <SidebarPageLayout headerContent={<span className="text-sm font-medium">RTO dashboard</span>}>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b83b00] uppercase">Administration</p>
            <h1 className="text-3xl font-semibold tracking-tight">RTO dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">Saved office-day plans for the selected Monday–Friday week.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous week" onClick={previousWeek}><ChevronLeft /></Button>
            <span className="min-w-40 text-center text-sm font-medium">{weekLabel}</span>
            <Button variant="outline" size="icon" aria-label="Next week" onClick={nextWeek}><ChevronRight /></Button>
            <Button variant="outline" onClick={currentWeek}><CalendarDays /><span className="hidden sm:inline">This week</span></Button>
          </div>
        </div>

        {error && <DataLoadError message={error} onRetry={retry} retrying={loading} />}
        {loading ? <DashboardSkeleton /> : summary ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="grid-cols-[auto_1fr] items-center gap-3 space-y-0 pb-2"><BarChart3 className="size-4 shrink-0 text-[#b83b00]" /><CardTitle className="text-sm font-medium">Planned RTO days</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-semibold">{formatNumber(summary.totalRtoDays)}</p><p className="mt-1 text-xs text-muted-foreground">Saved user office-day selections across five weekdays</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="grid-cols-[auto_1fr] items-center gap-3 space-y-0 pb-2"><Users className="size-4 shrink-0 text-[#b83b00]" /><CardTitle className="text-sm font-medium">Unique attendees</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-semibold">{formatNumber(summary.uniqueAttendees)}</p><p className="mt-1 text-xs text-muted-foreground">People with at least one saved office day this week</p></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Daily attendance</CardTitle><CardDescription>Number of users with a saved office day on each weekday.</CardDescription></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {summary.daily.map((day) => (
                  <div key={day.date} className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-sm font-medium">{formatDate(day.date, { weekday: "long" })}</p>
                    <p className="mt-2 text-2xl font-semibold">{formatNumber(day.attendees)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(day.date, { month: "short", day: "numeric" })}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <BreakdownCard title="By platform" description="RTO days and distinct attendees grouped by each user’s platform." rows={summary.byPlatform} />
              <BreakdownCard title="By work schedule" description="RTO days and distinct attendees grouped by each user’s assigned work schedule." rows={summary.byWorkSchedule} />
            </div>

            <div className="grid gap-4">
              <DailyBreakdownCard title="RTOs per day by platform" groups={summary.byPlatform} daily={summary.daily} />
              <DailyBreakdownCard title="RTOs per day by work schedule" groups={summary.byWorkSchedule} daily={summary.daily} />
            </div>
          </>
        ) : null}
      </main>
    </SidebarPageLayout>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading RTO dashboard" aria-busy="true" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((item) => <Card key={item}><CardHeader><Skeleton className="h-4 w-36" /></CardHeader><CardContent><Skeleton className="h-9 w-24" /><Skeleton className="mt-2 h-3 w-52" /></CardContent></Card>)}
      </div>
      <Card>
        <CardHeader><Skeleton className="h-5 w-36" /><Skeleton className="h-4 w-64" /></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((item) => <div key={item} className="space-y-3 rounded-xl border p-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-20" /></div>)}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((card) => <Card key={card}><CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-56" /></CardHeader><CardContent className="space-y-4">{[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-4 w-full" />)}</CardContent></Card>)}
      </div>
      <div className="grid gap-4">
        {[0, 1].map((card) => <Card key={card}><CardHeader><Skeleton className="h-5 w-56" /></CardHeader><CardContent className="space-y-3">{[0, 1, 2, 3, 4].map((row) => <Skeleton key={row} className="h-8 w-full" />)}</CardContent></Card>)}
      </div>
      <span className="sr-only">Loading RTO dashboard</span>
    </div>
  );
}

function DailyBreakdownCard({ title, groups, daily }: {
  title: string;
  groups: WeeklyRtoSummary["byPlatform"];
  daily: WeeklyRtoSummary["daily"];
}) {
  const groupTotals = groups.map((group) => ({
    key: group.id ?? group.name,
    total: group.daily.reduce((sum, day) => sum + day.attendees, 0),
  }));
  const grandTotal = groupTotals.reduce((sum, group) => sum + group.total, 0);

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Saved office-day attendees for each weekday, split by group.</CardDescription></CardHeader>
      <CardContent className="p-0">
        {groups.length === 0 ? <p className="px-6 py-8 text-center text-sm text-muted-foreground">No saved RTO plans for this week.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Day</th>{groups.map((group) => <th key={group.id ?? group.name} className="min-w-32 px-5 py-3 text-right font-medium">{group.name}</th>)}<th className="min-w-32 bg-[#fff3e8] px-5 py-3 text-right font-bold text-[#8a2c00]">Daily total</th></tr></thead>
              <tbody className="divide-y">{daily.map((day) => {
                const dayTotal = groups.reduce((sum, group) => sum + (group.daily.find((groupDay) => groupDay.date === day.date)?.attendees ?? 0), 0);
                return <tr key={day.date}><th scope="row" className="whitespace-nowrap px-5 py-3 font-medium">{formatDate(day.date, { weekday: "short", month: "short", day: "numeric" })}</th>{groups.map((group) => <td key={group.id ?? group.name} className="px-5 py-3 text-right">{formatNumber(group.daily.find((groupDay) => groupDay.date === day.date)?.attendees ?? 0)}</td>)}<td className="bg-[#fff3e8] px-5 py-3 text-right font-bold text-[#8a2c00]">{formatNumber(dayTotal)}</td></tr>;
              })}</tbody>
              <tfoot className="border-t-2 border-[#b83b00]/30 bg-[#fff3e8] text-[#8a2c00]"><tr><th scope="row" className="px-5 py-3 text-left font-bold">Week total</th>{groupTotals.map((group) => <td key={group.key} className="px-5 py-3 text-right text-base font-bold">{formatNumber(group.total)}</td>)}<td className="px-5 py-3 text-right text-base font-extrabold">{formatNumber(grandTotal)}</td></tr></tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownCard({ title, description, rows }: {
  title: string;
  description: string;
  rows: WeeklyRtoSummary["byPlatform"];
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? <p className="px-6 py-8 text-center text-sm text-muted-foreground">No saved RTO plans for this week.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Group</th><th className="px-5 py-3 text-right font-medium">Attendees</th><th className="px-5 py-3 text-right font-medium">RTO days</th></tr></thead>
              <tbody className="divide-y">{rows.map((row) => <tr key={row.id ?? row.name}><td className="px-5 py-3 font-medium">{row.name}</td><td className="px-5 py-3 text-right">{formatNumber(row.attendees)}</td><td className="px-5 py-3 text-right">{formatNumber(row.rtoDays)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
