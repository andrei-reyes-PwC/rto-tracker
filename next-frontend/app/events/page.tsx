import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/api/session";
import EventManagement from "./event-management";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Events" };

export const instant = false;
export default async function EventsPage() {
  const sessionId = (await cookies()).get("JSESSIONID")?.value;
  if (!sessionId) redirect("/login");
  const user = await getSessionUser(sessionId);
  if (!user) redirect("/login");
  const isSuperAdmin = user.roles.includes("SUPER_ADMIN");
  const canManagePlatformEvents = user.roles.includes("ADMIN") && user.platform !== null;
  if (!isSuperAdmin && !canManagePlatformEvents) notFound();
  return <EventManagement isSuperAdmin={isSuperAdmin} platform={user.platform} />;
}
