import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/api/session";
import SiteManagement from "./site-management";

export const instant = false;

export default async function SitesPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("JSESSIONID")?.value;
  if (!sessionId) redirect("/login");

  const user = await getSessionUser(sessionId);
  if (!user) redirect("/login");
  if (!user.roles.includes("SUPER_ADMIN")) notFound();

  return <SiteManagement />;
}
