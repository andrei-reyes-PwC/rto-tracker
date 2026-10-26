"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import type { LunchRecipient } from "@/api/lunch";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PaginationControls from "@/components/PaginationControls";
import { getLunchRosterPage, type LunchRosterOptions } from "@/api/lunch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const pageSizeOptions = [10, 25, 50];

export default function LunchRosterPreview({ locked = false, date, totalCount, refreshKey = 0, siteFilter, options }: { locked?: boolean; date: string; totalCount: number; refreshKey?: number; siteFilter: string; options: LunchRosterOptions }) {
  const [platformFilter, setPlatformFilter] = useState("all");
  const [workScheduleFilter, setWorkScheduleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [emailSearch, setEmailSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [serverRecipients, setServerRecipients] = useState<LunchRecipient[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const debouncedEmailSearch = useDebouncedValue(emailSearch);
  const platformOptions = useMemo(() => options.platforms, [options.platforms]);
  const workScheduleOptions = useMemo(() => options.workSchedules, [options.workSchedules]);
  useEffect(() => {
    const controller = new AbortController();
    setRosterError(null);
    void getLunchRosterPage(page, pageSize, siteFilter, platformFilter, workScheduleFilter, statusFilter, debouncedEmailSearch, controller.signal, locked ? date : undefined).then((result) => {
      if (!controller.signal.aborted) { setServerRecipients(result.recipients); setTotalElements(result.totalElements); }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setRosterError(error instanceof Error ? error.message : "Could not load this roster page.");
    });
    return () => controller.abort();
  }, [date, debouncedEmailSearch, locked, page, pageSize, platformFilter, siteFilter, statusFilter, workScheduleFilter, refreshKey]);
  const displayedRecipients = serverRecipients;
  const displayedTotalPages = Math.ceil(totalElements / pageSize);
  const displayedPage = Math.min(page, Math.max(displayedTotalPages - 1, 0));

  return (
    <Card>
      <CardHeader className="gap-4 sm:grid-cols-[1fr_auto]">
        <div><CardTitle>Users to be included</CardTitle><CardDescription>Review the roster for the selected lunch date.</CardDescription></div>
        <p className="flex items-center gap-2 py-2 text-sm"><Users className="size-4 shrink-0 text-[#b83b00]" /><span className="font-semibold">{totalCount}</span><span className="text-muted-foreground">{totalCount === 1 ? "user" : "users"}</span></p>
      </CardHeader>
      <CardContent className="space-y-4">
      {rosterError && <Alert variant="destructive"><AlertDescription>{rosterError}</AlertDescription></Alert>}
      <div className="flex w-full flex-wrap gap-2">
        <div className="relative w-full sm:min-w-56 sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={emailSearch} onChange={(event) => { setPage(0); setEmailSearch(event.target.value); }} maxLength={254} placeholder="Search by email" aria-label="Search lunch users by email" className="pl-9" />
        </div>
        <Select value={platformFilter} onValueChange={(value) => { setPage(0); setPlatformFilter(value ?? "all"); }}>
          <SelectTrigger className="w-fit max-w-full sm:w-[190px]" aria-label="Filter lunch users by platform"><SelectValue placeholder="All platforms" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All platforms</SelectItem>{platformOptions.map((platform) => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={workScheduleFilter} onValueChange={(value) => { setPage(0); setWorkScheduleFilter(value ?? "all"); }}>
          <SelectTrigger className="w-fit max-w-full sm:w-[190px]" aria-label="Filter lunch users by work schedule"><SelectValue placeholder="All work schedules" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All work schedules</SelectItem>{workScheduleOptions.map((schedule) => <SelectItem key={schedule} value={schedule}>{schedule}</SelectItem>)}</SelectContent>
        </Select>
        {locked && <Select value={statusFilter} onValueChange={(value) => { setPage(0); setStatusFilter(value ?? "all"); }}>
          <SelectTrigger className="w-fit max-w-full sm:w-[170px]" aria-label="Filter lunch users by status"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="received">Received</SelectItem></SelectContent>
        </Select>}
      </div>
      {totalElements === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No users match these filters.</p> : <>
      <div className="max-h-96 space-y-3 overflow-y-auto p-1 md:hidden">
        {displayedRecipients.map((recipient) => <article key={recipient.email} className="rounded-xl border bg-muted/10 p-4">
          <div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-semibold" title={recipient.email}>{recipient.email}</p>{locked && <Badge variant={recipient.received ? "default" : "secondary"}>{recipient.received ? "Received" : "Pending"}</Badge>}</div>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <div className="min-w-0 rounded-lg bg-background p-3"><dt className="text-xs text-muted-foreground">Platform</dt><dd className="mt-1 truncate text-sm font-medium" title={recipient.platform ?? "No platform"}>{recipient.platform ?? "No platform"}</dd></div>
            <div className="min-w-0 rounded-lg bg-background p-3"><dt className="text-xs text-muted-foreground">Work schedule</dt><dd className="mt-1 truncate text-sm font-medium" title={recipient.workSchedule ?? "No work schedule"}>{recipient.workSchedule ?? "No work schedule"}</dd></div>
          </dl>
        </article>)}
      </div>
      <div className="hidden max-h-96 min-w-0 overflow-y-auto overflow-x-hidden md:block">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>{locked ? <><col className="w-[36%]" /><col className="w-[22%]" /><col className="w-[22%]" /><col className="w-[20%]" /></> : <><col className="w-2/5" /><col className="w-[30%]" /><col className="w-[30%]" /></>}</colgroup>
          <thead className="sticky top-0 border-y bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Email</th><th className="px-3 py-3 font-medium">Platform</th><th className="px-3 py-3 font-medium">Work schedule</th>{locked && <th className="px-3 py-3 font-medium">Status</th>}</tr></thead>
          <tbody className="divide-y">{displayedRecipients.map((recipient) => <tr key={recipient.email} className="transition-colors hover:bg-muted/50"><td className="truncate px-3 py-3" title={recipient.email}>{recipient.email}</td><td className="truncate px-3 py-3" title={recipient.platform ?? "No platform"}>{recipient.platform ?? "No platform"}</td><td className="truncate px-3 py-3" title={recipient.workSchedule ?? "No work schedule"}>{recipient.workSchedule ?? "No work schedule"}</td>{locked && <td className="px-3 py-3"><Badge variant={recipient.received ? "default" : "secondary"}>{recipient.received ? "Received" : "Pending"}</Badge></td>}</tr>)}</tbody>
        </table>
      </div>
      <PaginationControls className="px-0" page={displayedPage} totalPages={displayedTotalPages} pageSize={pageSize} pageSizeOptions={pageSizeOptions} onPageChange={setPage} onPageSizeChange={(size) => { setPage(0); setPageSize(size); }} />
      </>}
      </CardContent>
    </Card>
  );
}
