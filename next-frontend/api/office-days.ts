export type OfficeDaySchedule = {
  month: string;
  officeDays: string[];
};

export type MonthlyOfficeDaySchedule = OfficeDaySchedule & {
  platformAttendance: { date: string; attendees: number }[];
  daysOff: number[];
};

export type PlatformOfficeDaySchedule = {
  date: string;
  platformName: string | null;
  colleagues: { date: string; email: string }[];
};

type ApiErrorResponse = {
  message?: string;
  details?: string[];
};

async function responseError(response: Response, fallback: string) {
  const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  return error?.details?.join(" ") || error?.message || fallback;
}

export async function getOfficeDays(month: string, signal?: AbortSignal): Promise<MonthlyOfficeDaySchedule> {
  const response = await fetch(`/api/office-days?month=${encodeURIComponent(month)}`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error(await responseError(response, "Could not load your schedule. Please try again."));
  }
  return (await response.json()) as MonthlyOfficeDaySchedule;
}

export async function getPlatformOfficeDays(date: string, signal?: AbortSignal): Promise<PlatformOfficeDaySchedule> {
  const response = await fetch(`/api/office-days/platform?date=${encodeURIComponent(date)}`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error(await responseError(response, "Could not load your platform's office plans. Please try again."));
  }
  return (await response.json()) as PlatformOfficeDaySchedule;
}

export async function replaceOfficeDays(
  month: string,
  dates: string[],
): Promise<OfficeDaySchedule> {
  const response = await fetch(`/api/office-days?month=${encodeURIComponent(month)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ dates }),
  });
  if (!response.ok) {
    throw new Error(await responseError(response, "Could not save your schedule. Please try again."));
  }
  return (await response.json()) as OfficeDaySchedule;
}
