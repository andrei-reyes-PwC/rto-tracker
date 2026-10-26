"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import type { LunchDay } from "@/api/lunch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PaginationControls from "@/components/PaginationControls";

const pageSizeOptions = [10, 25, 50];

export default function LunchRosterPreview({ recipients }: { recipients: LunchDay["recipients"] }) {
  const [platformFilter, setPlatformFilter] = useState("all");
  const [workScheduleFilter, setWorkScheduleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const platformOptions = useMemo(() => [...new Set(recipients.map((recipient) => recipient.platform ?? "No platform"))].sort((a, b) => a.localeCompare(b)), [recipients]);
  const workScheduleOptions = useMemo(() => [...new Set(recipients.map((recipient) => recipient.workSchedule ?? "No work schedule"))].sort((a, b) => a.localeCompare(b)), [recipients]);
  const filteredRecipients = useMemo(() => recipients.filter((recipient) =>
    (platformFilter === "all" || (recipient.platform ?? "No platform") === platformFilter)
    && (workScheduleFilter === "all" || (recipient.workSchedule ?? "No work schedule") === workScheduleFilter)),
  [recipients, platformFilter, workScheduleFilter]);
  const totalPages = Math.ceil(filteredRecipients.length / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const visibleRecipients = filteredRecipients.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <Card>
      <CardHeader className="gap-4 sm:grid-cols-[1fr_auto]">
        <div><CardTitle>Users to be included</CardTitle><CardDescription>Review the roster for the selected lunch date.</CardDescription></div>
        <p className="flex items-center gap-2 py-2 text-sm"><Users className="size-4 shrink-0 text-[#b83b00]" /><span className="font-semibold">{filteredRecipients.length}</span><span className="text-muted-foreground">{filteredRecipients.length === 1 ? "user" : "users"}</span></p>
      </CardHeader>
      <CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="roster-platform-filter">Platform</Label><Select value={platformFilter} onValueChange={(value) => { setPage(0); setPlatformFilter(value ?? "all"); }}><SelectTrigger id="roster-platform-filter" className="w-full"><SelectValue placeholder="All platforms" /></SelectTrigger><SelectContent><SelectItem value="all">All platforms</SelectItem>{platformOptions.map((platform) => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid gap-2"><Label htmlFor="roster-work-schedule-filter">Work schedule</Label><Select value={workScheduleFilter} onValueChange={(value) => { setPage(0); setWorkScheduleFilter(value ?? "all"); }}><SelectTrigger id="roster-work-schedule-filter" className="w-full"><SelectValue placeholder="All work schedules" /></SelectTrigger><SelectContent><SelectItem value="all">All work schedules</SelectItem>{workScheduleOptions.map((schedule) => <SelectItem key={schedule} value={schedule}>{schedule}</SelectItem>)}</SelectContent></Select></div>
      </div>
      {filteredRecipients.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No users match these filters.</p> : <>
      <div className="max-h-96 space-y-3 overflow-y-auto p-1 md:hidden">
        {visibleRecipients.map((recipient) => <article key={recipient.email} className="rounded-xl border bg-muted/10 p-4">
          <p className="truncate text-sm font-semibold" title={recipient.email}>{recipient.email}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <div className="min-w-0 rounded-lg bg-background p-3"><dt className="text-xs text-muted-foreground">Platform</dt><dd className="mt-1 truncate text-sm font-medium" title={recipient.platform ?? "No platform"}>{recipient.platform ?? "No platform"}</dd></div>
            <div className="min-w-0 rounded-lg bg-background p-3"><dt className="text-xs text-muted-foreground">Work schedule</dt><dd className="mt-1 truncate text-sm font-medium" title={recipient.workSchedule ?? "No work schedule"}>{recipient.workSchedule ?? "No work schedule"}</dd></div>
          </dl>
        </article>)}
      </div>
      <div className="hidden max-h-96 overflow-auto md:block">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup><col className="w-2/5" /><col className="w-[30%]" /><col className="w-[30%]" /></colgroup>
          <thead className="sticky top-0 border-y bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Email</th><th className="px-3 py-3 font-medium">Platform</th><th className="px-3 py-3 font-medium">Work schedule</th></tr></thead>
          <tbody className="divide-y">{visibleRecipients.map((recipient) => <tr key={recipient.email} className="transition-colors hover:bg-muted/50"><td className="truncate px-3 py-3" title={recipient.email}>{recipient.email}</td><td className="truncate px-3 py-3" title={recipient.platform ?? "No platform"}>{recipient.platform ?? "No platform"}</td><td className="truncate px-3 py-3" title={recipient.workSchedule ?? "No work schedule"}>{recipient.workSchedule ?? "No work schedule"}</td></tr>)}</tbody>
        </table>
      </div>
      <PaginationControls className="px-0" page={currentPage} totalPages={totalPages} pageSize={pageSize} pageSizeOptions={pageSizeOptions} onPageChange={setPage} onPageSizeChange={(size) => { setPage(0); setPageSize(size); }} />
      </>}
      </CardContent>
    </Card>
  );
}
