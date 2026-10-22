import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/api/session";
import EventManagement from "./event-management";

export const instant = false;
export default async function EventsPage() {
  const sessionId = (await cookies()).get("JSESSIONID")?.value;
  if (!sessionId) redirect("/login");
  const user = await getSessionUser(sessionId);
  if (!user) redirect("/login");
  if (!user.roles.includes("SUPER_ADMIN")) notFound();
  return <EventManagement />;
}
