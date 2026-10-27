"use client";

import { useEffect, useState } from "react";
import { getPlatformOfficeDays, type PlatformOfficeDaySchedule } from "@/api/office-days";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DataLoadError from "@/components/DataLoadError";
import { useAuth } from "@/providers/AuthProvider";
import { useSchedule } from "@/app/component/ScheduleProvider";

function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

export default function PlatformOfficeDays() {
  const { user } = useAuth();
  const { selectedPlatformDate } = useSchedule();
  const [schedule, setSchedule] = useState<PlatformOfficeDaySchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user?.platform || !selectedPlatformDate) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      getPlatformOfficeDays(selectedPlatformDate, controller.signal)
        .then((result) => { if (!controller.signal.aborted) setSchedule(result); })
        .catch((loadError: unknown) => {
          if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Could not load platform office plans.");
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [selectedPlatformDate, user?.platform, retryCount]);

  if (!user?.platform || !selectedPlatformDate) return null;
  const visibleSchedule = schedule?.date === selectedPlatformDate ? schedule : null;

  return (
    <Card className="border-slate-200/80 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Platform RTO plans</CardTitle>
        <CardDescription>
          {formatDate(selectedPlatformDate)} · {visibleSchedule?.platformName ?? user.platform.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto overscroll-contain">
        {error ? <DataLoadError message={error} onRetry={() => setRetryCount((count) => count + 1)} retrying={loading} /> : loading ? (
          <div role="status" aria-label="Loading platform plans" aria-busy="true" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-9 w-full" />)}
            <span className="sr-only">Loading platform plans</span>
          </div>
        ) : visibleSchedule && visibleSchedule.colleagues.length > 0 ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-1">
            {visibleSchedule.colleagues.map((colleague) => (
              <li key={colleague.email} className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700">
                {colleague.email}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No one else on your platform has a saved office plan for this day.</p>
        )}
      </CardContent>
    </Card>
  );
}
