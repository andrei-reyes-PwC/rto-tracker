"use client";

import { useCallback, useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { getLunchDay, lockLunchDay, type LunchDay } from "@/api/lunch";
import DataLoadError from "@/components/DataLoadError";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import LunchBreakdown from "./lunch-breakdown";
import LunchRosterPreview from "./lunch-roster-preview";

function currentLunchDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default function LunchProcurement() {
  const [date, setDate] = useState("");
  const [day, setDay] = useState<LunchDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayError, setDayError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    try { setDay(await lockLunchDay(date)); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Could not lock lunch."); }
    finally { setBusy(false); }
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
              <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>{day.locked ? "Lunch is locked" : "Lock lunch for this date"}</CardTitle><CardDescription>{day.locked ? `${day.recipients.length} users are on the locked list. The recipient list cannot be changed.` : `${day.recipients.length} users will be included. Review the overview below, then lock the list once.`}</CardDescription></div><Badge variant={day.locked ? "default" : "secondary"}>{day.locked ? "Locked" : "Open"}</Badge></div></CardHeader>
              {!day.locked && <CardContent><Button onClick={() => void lockDay()} disabled={busy || !date || day.recipients.length === 0}><LockKeyhole />Lock all users</Button></CardContent>}
            </Card>
            <Card>
              <CardHeader><CardTitle>User overview</CardTitle><CardDescription>Review users by platform and work schedule before locking.</CardDescription></CardHeader>
              <CardContent>
                <LunchBreakdown recipients={day.recipients} showReceiptCounts={false} />
              </CardContent>
            </Card>
            <LunchRosterPreview key={date} recipients={day.recipients} />
          </>
        )}
      </main>
    </SidebarPageLayout>
  );
}
