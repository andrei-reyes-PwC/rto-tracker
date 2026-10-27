import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/api/session";

export async function requireManagementUser(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("JSESSIONID")?.value;
  if (!sessionId) redirect("/login");

  const user = await getSessionUser(sessionId);
  if (!user) redirect("/login");
  if (!user.roles.includes("SUPER_ADMIN") && !(user.roles.includes("ADMIN") && user.platform)) notFound();
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireManagementUser();
  if (!user.roles.includes("SUPER_ADMIN")) notFound();
  return user;
}
