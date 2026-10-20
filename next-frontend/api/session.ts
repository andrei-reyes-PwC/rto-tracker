import { backendApiUrl } from "./backend-url";

export type SessionUser = {
  email: string;
  roles: string[];
};

export async function getSessionUser(sessionId: string): Promise<SessionUser | null> {
  try {
    const response = await fetch(`${backendApiUrl}/api/auth/me`, {
      headers: { Cookie: `JSESSIONID=${sessionId}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const user: unknown = await response.json();
    if (
      typeof user === "object"
      && user !== null
      && "email" in user
      && typeof user.email === "string"
      && "roles" in user
      && Array.isArray(user.roles)
      && user.roles.every((role: unknown) => typeof role === "string")
    ) {
      return user as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}
