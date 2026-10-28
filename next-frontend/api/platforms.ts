export type PlatformOption = { id: number; name: string };

export type Platform = PlatformOption & { userCount: number };

export type PlatformInput = { name: string };

type ApiErrorResponse = { message?: string; details?: string[] };

async function responseError(response: Response) {
  const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  return error?.details?.join(" ") || error?.message || "Could not complete this platform request. Please try again.";
}

export async function getPlatforms(search = "", signal?: AbortSignal): Promise<Platform[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const response = await fetch(`/api/platforms?${params}`, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as Platform[];
}

export async function getPlatformOptions(signal?: AbortSignal): Promise<PlatformOption[]> {
  const response = await fetch("/api/platforms/options", { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as PlatformOption[];
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
