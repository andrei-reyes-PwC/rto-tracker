import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/api/session";
import SettingsManagement from "./settings-management";

export const metadata: Metadata = { title: "Settings" };
export const instant = false;

export default async function SettingsPage() {
  const sessionId = (await cookies()).get("JSESSIONID")?.value;
  if (!sessionId) redirect("/login?next=/settings");
  const user = await getSessionUser(sessionId);
  if (!user) redirect("/login?next=/settings");
  const isSuperAdmin = user.roles.includes("SUPER_ADMIN");
  if (!isSuperAdmin && !(user.roles.includes("ADMIN") && user.platform !== null)) notFound();
  return <SettingsManagement isSuperAdmin={isSuperAdmin} />;
}
