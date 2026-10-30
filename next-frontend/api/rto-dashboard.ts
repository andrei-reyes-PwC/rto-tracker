export type DailyAttendance = { date: string; attendees: number };
export type GroupAttendance = {
  id: number | null;
  name: string;
  attendees: number;
  rtoDays: number;
  daily: DailyAttendance[];
};

export type WeeklyRtoSummary = {
  weekStart: string;
  weekEnd: string;
  totalRtoDays: number;
  uniqueAttendees: number;
  daily: DailyAttendance[];
  byPlatform: GroupAttendance[];
  byWorkSchedule: GroupAttendance[];
};

export type DashboardSiteOption = { id: number; name: string };

type ApiErrorResponse = { message?: string; details?: string[] };

async function responseError(response: Response, fallback = "Could not load the RTO dashboard. Please try again.") {
  const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  return error?.details?.join(" ") || error?.message || fallback;
}

export async function exportWeeklyRtoData(weekStart: string, siteFilter: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ weekStart });
  if (siteFilter !== "all") params.set("siteId", siteFilter);
  const response = await fetch(`/api/dashboard/rto/export?${params}`, {
    credentials: "include",
    cache: "no-store",
    signal,
    headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  });
  if (!response.ok) throw new Error(await responseError(response, "Could not export RTO data. Please try again."));
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const encodedFilename = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  const filename = encodedFilename
    ? decodeURIComponent(encodedFilename)
    : /filename="([^"]+)"/i.exec(disposition)?.[1] ?? `rto-dashboard-${weekStart}.xlsx`;
  return { blob: await response.blob(), filename };
}

export async function getRtoDashboardSites(signal?: AbortSignal): Promise<DashboardSiteOption[]> {
  const response = await fetch("/api/dashboard/rto/sites", {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as DashboardSiteOption[];
}

export async function getWeeklyRtoSummary(
  weekStart: string,
  siteFilter = "all",
  signal?: AbortSignal,
): Promise<WeeklyRtoSummary> {
  const params = new URLSearchParams({ weekStart });
  if (siteFilter !== "all") params.set("siteId", siteFilter);
  const response = await fetch(`/api/dashboard/rto?${params}`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as WeeklyRtoSummary;
}
