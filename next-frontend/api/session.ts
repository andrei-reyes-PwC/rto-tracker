import { backendApiUrl } from "./backend-url";

export type SessionUser = {
  email: string;
  roles: string[];
  platform: { id: number; name: string } | null;
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
      && "platform" in user
      && (user.platform === null || (
        typeof user.platform === "object"
        && "id" in user.platform
        && typeof user.platform.id === "number"
        && "name" in user.platform
        && typeof user.platform.name === "string"
      ))
    ) {
      return user as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}
