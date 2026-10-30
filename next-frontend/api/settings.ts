export type WeekendRules = { saturdayDayOff: boolean; sundayDayOff: boolean };
export type PlatformSettings = { id: number; name: string; inheritGlobal: boolean; effective: WeekendRules };
export type ManagementSettings = { global: WeekendRules; platforms: PlatformSettings[] };
export type SettingsInput = WeekendRules & { inheritGlobal: boolean };

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { message?: string; details?: string[] } | null;
    throw new Error(error?.details?.join(" ") || error?.message || "Could not complete the settings request. Please try again.");
  }
  return await response.json() as T;
}

export async function getSettings(signal?: AbortSignal): Promise<ManagementSettings> {
  return readResponse(await fetch("/api/settings", { credentials: "include", cache: "no-store", signal }));
}

export async function updateGlobalSettings(rules: WeekendRules): Promise<WeekendRules> {
  return readResponse(await fetch("/api/settings/global", {
    method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(rules),
  }));
}

export async function updatePlatformSettings(id: number, input: SettingsInput): Promise<PlatformSettings> {
  return readResponse(await fetch(`/api/settings/platforms/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(input),
  }));
}
