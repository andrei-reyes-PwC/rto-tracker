export type Platform = {
  id: number;
  name: string;
  userEmails: string[];
};

export type PlatformInput = {
  name: string;
  userEmails: string[];
};

type ApiErrorResponse = { message?: string; details?: string[] };

async function responseError(response: Response) {
  const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  return error?.details?.join(" ") || error?.message || "Could not complete this platform request. Please try again.";
}

export async function getPlatforms(): Promise<Platform[]> {
  const response = await fetch("/api/platforms", { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as Platform[];
}

export async function createPlatform(platform: PlatformInput): Promise<Platform> {
  const response = await fetch("/api/platforms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(platform),
  });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as Platform;
}

export async function updatePlatform(id: number, platform: PlatformInput): Promise<Platform> {
  const response = await fetch(`/api/platforms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(platform),
  });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as Platform;
}

export async function deletePlatform(id: number): Promise<void> {
  const response = await fetch(`/api/platforms/${id}`, { method: "DELETE", credentials: "include" });
  if (!response.ok) throw new Error(await responseError(response));
}
