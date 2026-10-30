"use client";

import { RtoDashboardProvider, useRtoDashboard } from "@/providers/RtoDashboardProvider";
import { CalendarDays, ChevronLeft, ChevronRight, Download, LoaderCircle } from "lucide-react";
import type { WeeklyRtoSummary } from "@/api/rto-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import DataLoadError from "@/components/DataLoadError";
import PageHeading from "@/components/PageHeading";
import InlineNotification from "@/components/InlineNotification";

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
  const { weekStart, siteFilter, setSiteFilter, sites, summary, loading, error, retry, previousWeek, nextWeek, currentWeek, addDays, exporting, exportError, exportData, dismissExportError } = useRtoDashboard();

  const weekLabel = summary
    ? `${formatDate(summary.weekStart, { month: "short", day: "numeric" })} – ${formatDate(summary.weekEnd, { month: "short", day: "numeric", year: "numeric" })}`
    : `${formatDate(weekStart, { month: "short", day: "numeric" })} – ${formatDate(addDays(weekStart, 4), { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <SidebarPageLayout headerContent={<span className="text-sm font-medium">RTO dashboard</span>}>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
        <PageHeading category="Workplace insights" title="RTO dashboard" description="Saved office-day plans for the selected Monday to Friday week." />

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex w-fit max-w-full items-center gap-3 sm:grid sm:w-64 sm:grid-cols-[auto_minmax(0,1fr)]">
              <label htmlFor="dashboard-site-filter" className="text-sm font-medium">Site</label>
              <Select value={siteFilter} onValueChange={setSiteFilter} disabled={loading || exporting}>
                <SelectTrigger id="dashboard-site-filter" aria-label="Filter dashboard by site" className="w-fit max-w-[calc(100vw-6rem)] bg-background sm:w-full">
                  <SelectValue placeholder="All sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sites</SelectItem>
                  {sites.map((site) => <SelectItem key={site.id} value={String(site.id)}>{site.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Previous week" onClick={previousWeek} disabled={exporting}><ChevronLeft /></Button>
              <span className="min-w-40 text-center text-sm font-medium">{weekLabel}</span>
              <Button variant="outline" size="icon" aria-label="Next week" onClick={nextWeek} disabled={exporting}><ChevronRight /></Button>
              <Button variant="outline" onClick={currentWeek} disabled={exporting}><CalendarDays /><span className="hidden sm:inline">This week</span></Button>
            </div>
          </div>
          <Button className="w-full shrink-0 md:w-auto" onClick={() => void exportData()} disabled={loading || exporting || !summary || !!error} aria-busy={exporting}>
            {exporting ? <LoaderCircle className="animate-spin" /> : <Download />}
            {exporting ? "Exporting…" : "Export data"}
          </Button>
        </div>

        {exportError && <InlineNotification message={exportError} onDismiss={dismissExportError} />}

        {error && <DataLoadError message={error} onRetry={retry} retrying={loading} />}

        {loading ? <DashboardSkeleton /> : summary ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {summary.daily.map((day) => (
                <div key={day.date} className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-sm font-medium">{formatDate(day.date, { weekday: "long" })}</p>
                  <p className="mt-2 text-2xl font-semibold">{formatNumber(day.attendees)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(day.date, { month: "short", day: "numeric" })}</p>
                </div>
              ))}
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => <div key={item} className="space-y-3 rounded-xl border p-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-20" /></div>)}
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
          <>
          <div className="space-y-3 p-4 md:hidden">
            {daily.map((day) => {
              const dayTotal = groups.reduce((sum, group) => sum + (group.daily.find((groupDay) => groupDay.date === day.date)?.attendees ?? 0), 0);
              return <section key={day.date} className="rounded-xl border bg-muted/10 p-4">
                <div className="flex items-center justify-between gap-3 border-b pb-3">
                  <h3 className="text-sm font-semibold">{formatDate(day.date, { weekday: "short", month: "short", day: "numeric" })}</h3>
                  <p className="text-sm font-bold text-[#8a2c00]">{formatNumber(dayTotal)} total</p>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {groups.map((group) => <div key={group.id ?? group.name} className="min-w-0 rounded-lg bg-background p-3">
                    <dt className="truncate text-xs text-muted-foreground" title={group.name}>{group.name}</dt>
                    <dd className="mt-1 text-base font-semibold">{formatNumber(group.daily.find((groupDay) => groupDay.date === day.date)?.attendees ?? 0)}</dd>
                  </div>)}
                </dl>
              </section>;
            })}
            <section className="rounded-xl border border-[#b83b00]/30 bg-[#fff3e8] p-4 text-[#8a2c00]">
              <h3 className="text-sm font-bold">Week total</h3>
              <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {groupTotals.map((group, index) => <div key={group.key} className="rounded-lg bg-white/70 p-3">
                  <dt className="truncate text-xs text-[#8a2c00]/75" title={groups[index].name}>{groups[index].name}</dt>
                  <dd className="mt-1 text-base font-bold">{formatNumber(group.total)}</dd>
                </div>)}
                <div className="rounded-lg bg-white/70 p-3">
                  <dt className="text-xs font-semibold">All groups</dt>
                  <dd className="mt-1 text-base font-extrabold">{formatNumber(grandTotal)}</dd>
                </div>
              </dl>
            </section>
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup><col className="w-36" />{daily.map((day) => <col key={day.date} className="w-20" />)}<col className="w-24" /></colgroup>
              <thead className="border-y bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Group</th>{daily.map((day) => <th key={day.date} className="min-w-20 px-2 py-3 text-right font-medium">{formatDate(day.date, { weekday: "short", month: "short", day: "numeric" })}</th>)}<th className="min-w-24 bg-[#fff3e8] px-3 py-3 text-right font-bold text-[#8a2c00]">Week total</th></tr></thead>
              <tbody className="divide-y">{groups.map((group, index) => <tr key={group.id ?? group.name}>
                <th scope="row" className="truncate px-3 py-3 font-medium" title={group.name}>{group.name}</th>
                {daily.map((day) => <td key={day.date} className="px-2 py-3 text-right">{formatNumber(group.daily.find((groupDay) => groupDay.date === day.date)?.attendees ?? 0)}</td>)}
                <td className="bg-[#fff3e8] px-3 py-3 text-right font-bold text-[#8a2c00]">{formatNumber(groupTotals[index].total)}</td>
              </tr>)}</tbody>
              <tfoot className="border-t-2 border-[#b83b00]/30 bg-[#fff3e8] text-[#8a2c00]"><tr><th scope="row" className="px-3 py-3 text-left font-bold">Daily total</th>{daily.map((day) => <td key={day.date} className="px-2 py-3 text-right font-bold">{formatNumber(groups.reduce((sum, group) => sum + (group.daily.find((groupDay) => groupDay.date === day.date)?.attendees ?? 0), 0))}</td>)}<td className="px-3 py-3 text-right text-base font-extrabold">{formatNumber(grandTotal)}</td></tr></tfoot>
            </table>
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
