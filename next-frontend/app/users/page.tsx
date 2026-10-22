import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/api/session";
import UserManagement from "./user-management";

export const instant = false;

export default async function UsersPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("JSESSIONID")?.value;
  if (!sessionId) redirect("/login");

  const user = await getSessionUser(sessionId);
  if (!user) redirect("/login");
  const isSuperAdmin = user.roles.includes("SUPER_ADMIN");
  const isPlatformAdmin = user.roles.includes("ADMIN") && user.platform !== null;
  if (!isSuperAdmin && !isPlatformAdmin) notFound();

  return <UserManagement readOnly={!isSuperAdmin} platformName={isPlatformAdmin ? user.platform?.name : undefined} />;
}
