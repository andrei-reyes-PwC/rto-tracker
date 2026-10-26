export type Site = { id: number; name: string; userCount: number };

export type SiteDetails = { id: number; name: string; userEmails: string[] };

export type SiteInput = { name: string; userEmails: string[] };

type ApiErrorResponse = { message?: string; details?: string[] };

async function responseError(response: Response) {
  const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  return error?.details?.join(" ") || error?.message || "Could not complete this site request. Please try again.";
}

export async function getSites(search = "", signal?: AbortSignal): Promise<Site[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const response = await fetch(`/api/sites?${params}`, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as Site[];
}

export async function getSite(id: number): Promise<SiteDetails> {
  const response = await fetch(`/api/sites/${id}`, { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as SiteDetails;
}

export async function createSite(site: SiteInput): Promise<void> {
  const response = await fetch("/api/sites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(site),
  });
  if (!response.ok) throw new Error(await responseError(response));
}

export async function updateSite(id: number, site: SiteInput): Promise<void> {
  const response = await fetch(`/api/sites/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(site),
  });
  if (!response.ok) throw new Error(await responseError(response));
}

export async function deleteSite(id: number): Promise<void> {
  const response = await fetch(`/api/sites/${id}`, { method: "DELETE", credentials: "include" });
  if (!response.ok) throw new Error(await responseError(response));
}
