export type LunchDay = {
  date: string;
  locked: boolean;
  recipients: { email: string; received: boolean; platform: string | null; workSchedule: string | null }[];
};

type ApiError = { message?: string; details?: string[] };

async function errorMessage(response: Response) {
  const error = (await response.json().catch(() => null)) as ApiError | null;
  return error?.details?.join(" ") || error?.message || "Lunch service request failed. Please try again.";
}

export async function getLunchDay(date: string, signal?: AbortSignal): Promise<LunchDay> {
  const response = await fetch(`/api/lunch/${date}`, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as LunchDay;
}

export async function lockLunchDay(date: string): Promise<LunchDay> {
  const response = await fetch("/api/lunch", {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as LunchDay;
}

export async function updateLunchReceived(date: string, email: string, received: boolean): Promise<LunchDay> {
  const response = await fetch(`/api/lunch/${date}/recipients/${encodeURIComponent(email)}/received`, {
    method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ received }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as LunchDay;
}
