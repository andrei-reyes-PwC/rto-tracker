"use client";

import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { getLunchDay, lockLunchDay, scanLunchCredential, type LunchScanResult, type LunchSummary } from "@/api/lunch";
import DataLoadError from "@/components/DataLoadError";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function LunchProcurement() {
  const [date, setDate] = useState("");
  const [day, setDay] = useState<LunchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayError, setDayError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmLockOpen, setConfirmLockOpen] = useState(false);
  const [rosterRefreshKey, setRosterRefreshKey] = useState(0);

  useEffect(() => { setDate(currentLunchDate()); }, []);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!date) return;
    setLoading(true);
    setDayError(null);
    try {
      const result = await getLunchDay(date, signal);
      if (!signal?.aborted) setDay(result);
    } catch (error) {
      if (!signal?.aborted) setDayError(error instanceof Error ? error.message : "Could not load the lunch roster.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [date]);

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
      setDay(await lockLunchDay(date));
      setConfirmLockOpen(false);
    }
    catch (error) { setActionError(error instanceof Error ? error.message : "Could not lock lunch."); }
    finally { setBusy(false); }
  }

  async function scanCredential(credential: string): Promise<LunchScanResult> {
    const result = await scanLunchCredential(date, credential);
    try { setDay(await getLunchDay(date)); } catch { /* Keep the scan result visible even if the summary refresh fails. */ }
    setRosterRefreshKey((value) => value + 1);
    return result;
  }

  return (
    <SidebarPageLayout headerContent={<h1 className="text-base font-semibold">Lunch procurement</h1>}>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b83b00] uppercase">Administration</p><h1 className="text-3xl font-semibold tracking-tight">Lunch procurement</h1><p className="mt-2 text-sm text-muted-foreground">Review the roster before locking lunch for a day.</p></div>
          <div className="grid gap-2"><Label htmlFor="lunch-date">Lunch date</Label><Input id="lunch-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full sm:w-48" /></div>
        </section>
        {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}
        {dayError ? <DataLoadError message={dayError} onRetry={() => { void refresh(); }} /> : loading ? (
          <div className="space-y-5" aria-busy="true" aria-label="Loading lunch roster"><Skeleton className="h-40" /><Skeleton className="h-[480px]" /></div>
        ) : day && (
          <>
            <Card>
              <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>{day.locked ? "Lunch is locked" : "Lock lunch for this date"}</CardTitle><CardDescription>{day.locked ? `${day.totalRecipients} users are on the locked list. The recipient list cannot be changed.` : `${day.totalRecipients} users will be included. Review the overview below, then lock the list once.`}</CardDescription></div><Badge variant={day.locked ? "default" : "secondary"}>{day.locked ? "Locked" : "Open"}</Badge></div></CardHeader>
              {!day.locked && <CardContent><Button onClick={() => setConfirmLockOpen(true)} disabled={busy || !date || day.totalRecipients === 0}><LockKeyhole />Lock all users</Button></CardContent>}
            </Card>
            <div className={day.locked ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start" : "space-y-4"}>
              <Card>
                <CardHeader><CardTitle>User overview</CardTitle><CardDescription>Review users by platform and work schedule before locking.</CardDescription></CardHeader>
                <CardContent>
                  <LunchSummaryBreakdown breakdown={day.breakdown} totalRecipients={day.totalRecipients} locked={day.locked} />
                </CardContent>
              </Card>
              {day.locked && <aside className="xl:sticky xl:top-4"><LunchCredentialScanner onScan={scanCredential} /></aside>}
              <LunchRosterPreview key={date} locked={day.locked} date={date} totalCount={day.totalRecipients} refreshKey={rosterRefreshKey} />
            </div>
          </>
        )}
        <AlertDialog open={confirmLockOpen} onOpenChange={(open) => { if (!busy) setConfirmLockOpen(open); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Lock lunch for {formatLunchDate(date)}?</AlertDialogTitle>
              <AlertDialogDescription>This will lock the current roster of {day?.totalRecipients ?? 0} users for this date. The recipient list cannot be changed after locking.</AlertDialogDescription>
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
      if (result.status === "MARKED_RECEIVED") setMessage({ text: `${result.email} marked as received.`, error: false });
      else if (result.status === "ALREADY_RECEIVED") setMessage({ text: `${result.email} has already received lunch.`, error: true });
      else setMessage({ text: `${result.email} is not on today's locked lunch list.`, error: true });
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
    <CardHeader><CardTitle>Scan user credential</CardTitle><CardDescription>Scan or type a user email, then press Enter or select Check scan.</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input autoFocus autoComplete="off" aria-label="Scanned user email" placeholder="Scan user email" value={credential} onChange={(event) => setCredential(event.target.value)} onKeyDown={handleKeyDown} disabled={busy} />
        <Button type="button" onClick={() => void processCredential(credential)} disabled={busy || credential.trim().length === 0}>{busy ? "Checking…" : "Check scan"}</Button>
      </div>
      {message && (message.error
        ? <InlineNotification message={message.text} tone="error" onDismiss={() => setMessage(null)} />
        : <InlineNotification message={message.text} tone="success" onDismiss={() => setMessage(null)} />)}
    </CardContent>
  </Card>;
}
