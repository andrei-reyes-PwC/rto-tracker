"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { getLunchDay, getLunchRosterOptions, lockLunchDay, scanLunchCredential, type LunchRosterOptions, type LunchScanResult, type LunchSummary } from "@/api/lunch";
import DataLoadError from "@/components/DataLoadError";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import PageHeading from "@/components/PageHeading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import LunchSummaryBreakdown from "./lunch-summary-breakdown";
import LunchRosterPreview from "./lunch-roster-preview";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import InlineNotification from "@/components/InlineNotification";

function currentLunchDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatLunchDate(date: string) {
  if (!date) return "";
  const value = new Date(`${date}T00:00:00Z`);
  const monthDayYear = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(value);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(value);
  return `${monthDayYear} (${weekday})`;
}

export default function LunchProcurement({ initialDate, initialSiteId }: { initialDate?: string; initialSiteId?: string }) {
  const router = useRouter();
  const initialSelection = useRef({ date: initialDate, siteId: initialSiteId });
  const [date, setDate] = useState(initialDate ?? "");
  const [day, setDay] = useState<LunchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayError, setDayError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmLockOpen, setConfirmLockOpen] = useState(false);
  const [rosterRefreshKey, setRosterRefreshKey] = useState(0);
  const [rosterOptions, setRosterOptions] = useState<LunchRosterOptions>({ platforms: [], workSchedules: [], sites: [] });
  const [siteFilter, setSiteFilter] = useState(initialSiteId ?? "");
  const [siteOptionsLoaded, setSiteOptionsLoaded] = useState(false);
  const [siteOptionsError, setSiteOptionsError] = useState<string | null>(null);

  const updateSelectionUrl = useCallback((nextDate: string, nextSiteId: string) => {
    const params = new URLSearchParams();
    if (nextSiteId) params.set("siteId", nextSiteId);
    if (nextDate) params.set("date", nextDate);
    const query = params.toString();
    router.replace(query ? `/lunch?${query}` : "/lunch", { scroll: false });
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    void getLunchRosterOptions(controller.signal).then((result) => {
      if (!controller.signal.aborted) {
        setRosterOptions(result);
        const savedSelection = initialSelection.current;
        const savedSiteId = savedSelection.siteId ?? "";
        const initialSiteIsValid = savedSiteId !== "" && result.sites.some((site) => String(site.id) === savedSiteId);
        const nextSiteId = initialSiteIsValid ? savedSiteId : result.sites[0] ? String(result.sites[0].id) : "";
        setSiteFilter(nextSiteId);
        const nextDate = savedSelection.date ?? currentLunchDate();
        if (!savedSelection.date) setDate(nextDate);
        if (savedSelection.date || savedSelection.siteId) {
          updateSelectionUrl(nextDate, nextSiteId);
        }
      }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setSiteOptionsError(error instanceof Error ? error.message : "Could not load Sites.");
    }).finally(() => {
      if (!controller.signal.aborted) setSiteOptionsLoaded(true);
    });
    return () => controller.abort();
  }, [updateSelectionUrl]);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!date || !siteFilter) { setLoading(false); return; }
    setLoading(true);
    setDayError(null);
    try {
      const result = await getLunchDay(date, siteFilter, signal);
      if (!signal?.aborted) setDay(result);
    } catch (error) {
      if (!signal?.aborted) setDayError(error instanceof Error ? error.message : "Could not load the lunch roster.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [date, siteFilter]);

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [date, refresh]);

  async function lockDay() {
    setBusy(true);
    setActionError(null);
    try {
      setDay(await lockLunchDay(date, siteFilter));
      setConfirmLockOpen(false);
    }
    catch (error) { setActionError(error instanceof Error ? error.message : "Could not lock lunch."); }
    finally { setBusy(false); }
  }

  async function scanCredential(credential: string): Promise<LunchScanResult> {
    const result = await scanLunchCredential(date, credential, siteFilter);
    try { setDay(await getLunchDay(date, siteFilter)); } catch { /* Keep the scan result visible even if the summary refresh fails. */ }
    setRosterRefreshKey((value) => value + 1);
    return result;
  }

  return (
    <SidebarPageLayout headerContent={<h1 className="text-base font-semibold">Lunch procurement</h1>}>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
        <PageHeading category="Daily operations" title="Lunch procurement" description="Review the roster before locking lunch for a day."
          actions={<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="grid w-fit max-w-full gap-2 sm:w-64">
              <Label htmlFor="lunch-site-filter">Site</Label>
              <Select value={siteFilter} onValueChange={(value) => { const nextSiteId = value ?? ""; setActionError(null); setSiteFilter(nextSiteId); updateSelectionUrl(date, nextSiteId); }} disabled={!siteOptionsLoaded || !rosterOptions.sites.length || loading || busy || confirmLockOpen}>
                <SelectTrigger id="lunch-site-filter" aria-label="Select lunch site" className="w-fit max-w-[calc(100vw-6rem)] bg-background sm:w-full"><SelectValue placeholder="Select a site" /></SelectTrigger>
                <SelectContent>{rosterOptions.sites.map((site) => <SelectItem key={site.id} value={String(site.id)}>{site.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid w-fit max-w-full gap-2"><Label htmlFor="lunch-date">Lunch date</Label><Input id="lunch-date" type="date" value={date} onChange={(event) => { const nextDate = event.target.value; setDate(nextDate); updateSelectionUrl(nextDate, siteFilter); }} className="w-fit max-w-full sm:w-48" /></div>
          </div>}
        />
        {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}
        {siteOptionsError && <Alert variant="destructive"><AlertDescription>{siteOptionsError} Refresh the page to try again.</AlertDescription></Alert>}
        {siteOptionsLoaded && !siteOptionsError && rosterOptions.sites.length === 0 && <Alert><AlertDescription>No Sites are available for lunch procurement. Ask an administrator to configure a Site.</AlertDescription></Alert>}
        {dayError ? <DataLoadError message={dayError} onRetry={() => { void refresh(); }} /> : loading ? (
          <div className="space-y-5" aria-busy="true" aria-label="Loading lunch roster"><Skeleton className="h-40" /><Skeleton className="h-[480px]" /></div>
        ) : day && (
          <>
            <Card>
              <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>{day.locked ? "Lunch is locked" : "Lock lunch for this date"}</CardTitle><CardDescription>{day.locked ? `${day.originalTotal} users are on the original ${day.siteName ?? "selected Site"} list. Other registered users can collect lunch and will be recorded as additional recipients.` : `${day.totalRecipients} users with a saved office day at ${day.siteName ?? "the selected Site"} will be included. Review the overview below, then lock this Site and date.`}</CardDescription></div><Badge variant={day.locked ? "default" : "secondary"}>{day.locked ? "Locked" : "Open"}</Badge></div></CardHeader>
              {day.locked && <CardContent><dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div><dt className="text-xs text-muted-foreground">Original list</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{day.originalTotal.toLocaleString()}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Original received</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{(day.totalReceived - day.additionalReceived).toLocaleString()}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Additional received</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{day.additionalReceived.toLocaleString()}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Total received</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{day.totalReceived.toLocaleString()}</dd></div>
              </dl></CardContent>}
              {!day.locked && <CardContent><Button onClick={() => setConfirmLockOpen(true)} disabled={busy || !date || !siteFilter || day.totalRecipients === 0}><LockKeyhole />Lock {day.siteName ?? "selected Site"}</Button></CardContent>}
            </Card>
            <div className={day.locked ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start" : "space-y-4"}>
              <Card>
                <CardHeader><CardTitle>User overview</CardTitle><CardDescription>{day.locked ? "Original and additional recipients, grouped by platform and work schedule. Each cell shows original received / original list, additional received, and total received." : `Users with an office day saved for this date at ${day.siteName ?? "the selected Site"}, grouped by platform and work schedule.`}</CardDescription></CardHeader>
                <CardContent>
                  <LunchSummaryBreakdown breakdown={day.breakdown} totalRecipients={day.totalRecipients} locked={day.locked} />
                </CardContent>
              </Card>
              {day.locked && <aside className="xl:sticky xl:top-4"><LunchCredentialScanner onScan={scanCredential} /></aside>}
            </div>
            <LunchRosterPreview key={date} locked={day.locked} date={date} totalCount={day.totalRecipients} refreshKey={rosterRefreshKey} siteFilter={siteFilter} options={rosterOptions} />
          </>
        )}
        <AlertDialog open={confirmLockOpen} onOpenChange={(open) => { if (!busy) setConfirmLockOpen(open); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Lock lunch for {formatLunchDate(date)}?</AlertDialogTitle>
            <AlertDialogDescription>This will lock the current roster of {day?.totalRecipients ?? 0} users with a saved office day for {day?.siteName ?? "the selected Site"} on this date. The Site and original list cannot be changed after locking. Other registered users can still collect lunch as additional recipients.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={busy || !day || day.totalRecipients === 0} onClick={(event) => { event.preventDefault(); void lockDay(); }}>
                {busy ? "Locking…" : "Confirm lock"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </SidebarPageLayout>
  );
}

function LunchCredentialScanner({ onScan }: { onScan: (credential: string) => Promise<LunchScanResult> }) {
  const [credential, setCredential] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  async function processCredential(value: string) {
    const scanned = value.trim();
    if (!scanned || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await onScan(scanned);
      const listLabel = result.originalList ? "Original list" : "Additional recipient, not on original list";
      if (result.status === "MARKED_RECEIVED") setMessage({ text: `${result.email} marked as received. ${listLabel}.`, error: false });
      else if (result.status === "ALREADY_RECEIVED") setMessage({ text: `${result.email} has already received lunch. ${listLabel}.`, error: true });
      else setMessage({ text: `${result.email} is not a registered user. Check the email and try again.`, error: true });
      setCredential("");
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Could not process this scan.", error: true });
    } finally { setBusy(false); }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
    }
    if (event.key === "Enter") void processCredential(credential);
  }

  return <Card>
    <CardHeader><CardTitle>Scan user credential</CardTitle><CardDescription>Scan or type a registered user email, then press Enter or select Check scan. Users outside the original list are recorded as additional recipients at this Site.</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input autoFocus autoComplete="off" maxLength={254} aria-label="Scanned user email" placeholder="Scan user email" value={credential} onChange={(event) => setCredential(event.target.value)} onKeyDown={handleKeyDown} disabled={busy} />
        <Button type="button" onClick={() => void processCredential(credential)} disabled={busy || credential.trim().length === 0}>{busy ? "Checking…" : "Check scan"}</Button>
      </div>
      {message && (message.error
        ? <InlineNotification message={message.text} tone="error" onDismiss={() => setMessage(null)} />
        : <InlineNotification message={message.text} tone="success" onDismiss={() => setMessage(null)} />)}
    </CardContent>
  </Card>;
}
