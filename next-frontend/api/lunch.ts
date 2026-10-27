export type LunchRecipient = { email: string; received: boolean; handedOutBy: string | null; siteId: number | null; platform: string | null; workSchedule: string | null };
export async function getLunchProcurementDates(month: string, signal?: AbortSignal): Promise<string[]> {
  const response = await fetch(`/api/lunch/calendar?month=${encodeURIComponent(month)}`, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as string[];
}
export type LunchSummary = { date: string; locked: boolean; siteId: number | null; siteName: string | null; totalRecipients: number; totalReceived: number; breakdown: { platform: string; workSchedule: string; total: number; received: number }[] };
export type LunchScanResult = { status: "MARKED_RECEIVED" | "ALREADY_RECEIVED" | "NOT_ON_LIST"; email: string; received: boolean };

export type LunchRosterPage = { recipients: LunchRecipient[]; page: number; size: number; totalElements: number; totalPages: number };
export type LunchRosterOptions = { platforms: string[]; workSchedules: string[]; sites: { id: number; name: string }[] };

type ApiError = { message?: string; details?: string[] };

async function errorMessage(response: Response) {
  const error = (await response.json().catch(() => null)) as ApiError | null;
  return error?.details?.join(" ") || error?.message || "Lunch service request failed. Please try again.";
}

export async function getLunchDay(date: string, siteId: string, signal?: AbortSignal): Promise<LunchSummary> {
  const query = `?siteId=${encodeURIComponent(siteId)}`;
  const response = await fetch(`/api/lunch/${date}${query}`, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as LunchSummary;
}

export async function getLunchRosterPage(page: number, size: number, date: string, siteId: string, platform: string, workSchedule: string, status: string, search: string, signal?: AbortSignal, locked = false): Promise<LunchRosterPage> {
  const query = new URLSearchParams({ page: String(page), size: String(size) });
  if (!locked) query.set("date", date);
  if (siteId) query.set("siteId", siteId);
  if (platform !== "all") query.set("platform", platform);
  if (workSchedule !== "all") query.set("workSchedule", workSchedule);
  if (search.trim()) query.set("search", search.trim());
  if (locked && status !== "all") query.set("status", status);
  const path = locked ? `/api/lunch/${date}/roster/page` : "/api/lunch/roster/page";
  const response = await fetch(`${path}?${query}`, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as LunchRosterPage;
}

export async function getLunchRosterOptions(signal?: AbortSignal): Promise<LunchRosterOptions> {
  const response = await fetch("/api/lunch/roster/options", { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as LunchRosterOptions;
}

export async function lockLunchDay(date: string, siteId: string): Promise<LunchSummary> {
  const response = await fetch("/api/lunch", {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, siteId: Number(siteId) }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as LunchSummary;
}

export async function scanLunchCredential(date: string, credential: string, siteId: string): Promise<LunchScanResult> {
  const query = `?siteId=${encodeURIComponent(siteId)}`;
  const response = await fetch(`/api/lunch/${date}/scan${query}`, {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as LunchScanResult;
}
