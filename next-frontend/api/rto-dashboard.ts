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

type ApiErrorResponse = { message?: string; details?: string[] };

async function responseError(response: Response) {
  const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  return error?.details?.join(" ") || error?.message || "Could not load the RTO dashboard. Please try again.";
}

export async function getWeeklyRtoSummary(weekStart: string): Promise<WeeklyRtoSummary> {
  const params = new URLSearchParams({ weekStart });
  const response = await fetch(`/api/dashboard/rto?${params}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as WeeklyRtoSummary;
}
