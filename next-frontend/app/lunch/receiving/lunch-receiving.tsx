"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, Utensils } from "lucide-react";
import { getLunchDay, updateLunchReceived, type LunchDay } from "@/api/lunch";
import DataLoadError from "@/components/DataLoadError";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import LunchBreakdown from "../lunch-breakdown";

function currentLunchDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default function LunchReceiving() {
  const [date, setDate] = useState("");
  const [day, setDay] = useState<LunchDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayError, setDayError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  useEffect(() => { setDate(currentLunchDate()); }, []);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!date) return;
    setLoading(true);
    setDayError(null);
    try {
      const result = await getLunchDay(date, signal);
      if (!signal?.aborted) setDay(result);
    } catch (error) {
      if (!signal?.aborted) setDayError(error instanceof Error ? error.message : "Could not load lunch recipients.");
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

  const receivedCount = day?.recipients.filter((recipient) => recipient.received).length ?? 0;

  async function toggleReceived(email: string, received: boolean) {
    setBusyEmail(email);
    setActionError(null);
    try { setDay(await updateLunchReceived(date, email, received)); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Could not update receipt status."); }
    finally { setBusyEmail(null); }
  }

  return (
    <SidebarPageLayout headerContent={<h1 className="text-base font-semibold">Receiving lunch</h1>}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 sm:p-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm text-muted-foreground">Track daily lunch handouts.</p><h2 className="text-2xl font-semibold tracking-tight">Receiving lunch</h2></div>
          <div className="grid gap-2"><Label htmlFor="receiving-lunch-date">Lunch date</Label><Input id="receiving-lunch-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full sm:w-48" /></div>
        </section>
        {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}
        {dayError ? <DataLoadError message={dayError} onRetry={() => { void refresh(); }} /> : loading ? (
          <div className="space-y-5" aria-busy="true" aria-label="Loading lunch recipients"><Skeleton className="h-48" /><Skeleton className="h-[480px]" /></div>
        ) : day?.locked ? (
          <>
            <Card>
              <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Daily recipients</CardTitle><CardDescription>{receivedCount} of {day.recipients.length} marked received</CardDescription></div><div className="flex size-10 items-center justify-center rounded-full bg-[#e65300]/10 text-[#e65300]"><Utensils className="size-5" /></div></div></CardHeader>
              <CardContent><LunchBreakdown recipients={day.recipients} showReceiptCounts /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Lunch handout</CardTitle><CardDescription>Mark each person as they receive lunch.</CardDescription></CardHeader>
              <CardContent>
                {day.recipients.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">There are no recipients on this date.</p> : <ul className="divide-y">{day.recipients.map((recipient) => <li key={recipient.email} className="flex items-center justify-between gap-3 py-3"><span className="min-w-0"><span className="block truncate text-sm">{recipient.email}</span><span className="block truncate text-xs text-muted-foreground">{recipient.platform ?? "No platform"} · {recipient.workSchedule ?? "No work schedule"}</span></span><Button variant={recipient.received ? "secondary" : "outline"} size="sm" disabled={busyEmail !== null} onClick={() => void toggleReceived(recipient.email, !recipient.received)}>{recipient.received ? <><Check />Received</> : "Mark received"}</Button></li>)}</ul>}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card><CardHeader><CardTitle>No locked lunch list</CardTitle><CardDescription>Lock the user roster for this date before tracking handouts.</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href="/lunch">Go to lunch procurement</Link></Button></CardContent></Card>
        )}
      </main>
    </SidebarPageLayout>
  );
}
