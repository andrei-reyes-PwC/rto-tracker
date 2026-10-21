export type PlatformOption = { id: number; name: string };

export type Platform = PlatformOption & { userCount: number };

export type PlatformMembership = PlatformOption & { userEmails: string[] };

export type PlatformDetails = { id: number; name: string; userEmails: string[] };

export type PlatformInput = {
  name: string;
  userEmails: string[];
};

type ApiErrorResponse = { message?: string; details?: string[] };

async function responseError(response: Response) {
  const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  return error?.details?.join(" ") || error?.message || "Could not complete this platform request. Please try again.";
}

export async function getPlatforms(signal?: AbortSignal): Promise<Platform[]> {
  const response = await fetch("/api/platforms", { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as Platform[];
}

export async function getPlatformOptions(signal?: AbortSignal): Promise<PlatformOption[]> {
  const response = await fetch("/api/platforms/options", { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as PlatformOption[];
}

export async function getPlatform(id: number, signal?: AbortSignal): Promise<PlatformDetails> {
  const response = await fetch(`/api/platforms/${id}`, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as PlatformDetails;
}

export async function createPlatform(platform: PlatformInput): Promise<void> {
  const response = await fetch("/api/platforms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(platform),
  });
  if (!response.ok) throw new Error(await responseError(response));
}

export async function updatePlatform(id: number, platform: PlatformInput): Promise<void> {
  const response = await fetch(`/api/platforms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(platform),
  });
  if (!response.ok) throw new Error(await responseError(response));
}

export async function deletePlatform(id: number): Promise<void> {
  const response = await fetch(`/api/platforms/${id}`, { method: "DELETE", credentials: "include" });
  if (!response.ok) throw new Error(await responseError(response));
}
