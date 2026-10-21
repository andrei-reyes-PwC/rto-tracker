"use client";

import { useEffect, useState } from "react";
import { getPlatformOfficeDays, type PlatformOfficeDaySchedule } from "@/api/office-days";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  useEffect(() => {
    if (!user?.platform || !selectedPlatformDate) {
      setSchedule(null);
      setLoading(false);
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    getPlatformOfficeDays(selectedPlatformDate)
      .then((result) => { if (active) setSchedule(result); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load platform office plans.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedPlatformDate, user?.platform]);

  if (!user?.platform || !selectedPlatformDate) return null;

  return (
    <Card className="border-slate-200/80 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Platform RTO plans</CardTitle>
        <CardDescription>
          {formatDate(selectedPlatformDate)} · {schedule?.platformName ?? user.platform.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : loading ? (
          <p className="text-sm text-muted-foreground">Loading platform plans…</p>
        ) : schedule?.colleagues.length ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-1">
            {schedule.colleagues.map((colleague) => (
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
