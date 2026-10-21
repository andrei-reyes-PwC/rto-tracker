export type WorkSchedule = { id: number; name: string; userCount: number };

export type WorkScheduleDetails = { id: number; name: string; userEmails: string[] };

export type WorkScheduleInput = { name: string; userEmails: string[] };

type ApiErrorResponse = { message?: string; details?: string[] };

async function responseError(response: Response) {
  const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  return error?.details?.join(" ") || error?.message || "Could not complete this work schedule request. Please try again.";
}

export async function getWorkSchedules(): Promise<WorkSchedule[]> {
  const response = await fetch("/api/work-schedules", { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as WorkSchedule[];
}

export async function getWorkSchedule(id: number): Promise<WorkScheduleDetails> {
  const response = await fetch(`/api/work-schedules/${id}`, { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as WorkScheduleDetails;
}

export async function createWorkSchedule(schedule: WorkScheduleInput): Promise<void> {
  const response = await fetch("/api/work-schedules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(schedule),
  });
  if (!response.ok) throw new Error(await responseError(response));
}

export async function updateWorkSchedule(id: number, schedule: WorkScheduleInput): Promise<void> {
  const response = await fetch(`/api/work-schedules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(schedule),
  });
  if (!response.ok) throw new Error(await responseError(response));
}

export async function deleteWorkSchedule(id: number): Promise<void> {
  const response = await fetch(`/api/work-schedules/${id}`, { method: "DELETE", credentials: "include" });
  if (!response.ok) throw new Error(await responseError(response));
}
