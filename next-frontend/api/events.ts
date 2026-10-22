export type CalendarEvent = {
  id: number; date: string; title: string; kind: string; time: string; place: string;
  required: boolean; scope: "GLOBAL" | "PLATFORM"; platformId: number | null; platformName: string | null;
};
export type EventInput = Omit<CalendarEvent, "id" | "platformName">;
type ApiError = { message?: string; details?: string[] };
async function fail(response: Response) {
  const error = await response.json().catch(() => null) as ApiError | null;
  return error?.details?.join(" ") || error?.message || "Could not complete this event request.";
}
export async function getCalendarEvents(month: string, signal?: AbortSignal): Promise<CalendarEvent[]> {
  const response = await fetch(`/api/events?month=${encodeURIComponent(month)}`, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await fail(response));
  return await response.json() as CalendarEvent[];
}
export async function getManageEvents(search = "", date?: string, signal?: AbortSignal): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (date) params.set("date", date);
  const response = await fetch(`/api/events/manage?${params}`, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await fail(response));
  return await response.json() as CalendarEvent[];
}
export async function saveEvent(input: EventInput, id?: number): Promise<void> {
  const response = await fetch(id === undefined ? "/api/events" : `/api/events/${id}`, {
    method: id === undefined ? "POST" : "PUT", headers: { "Content-Type": "application/json" },
    credentials: "include", body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await fail(response));
}
export async function deleteEvent(id: number): Promise<void> {
  const response = await fetch(`/api/events/${id}`, { method: "DELETE", credentials: "include" });
  if (!response.ok) throw new Error(await fail(response));
}
