import { backendApiUrl } from "./backend-url";

export async function hasValidSession(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${backendApiUrl}/api/auth/me`, {
      headers: { Cookie: `JSESSIONID=${sessionId}` },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
