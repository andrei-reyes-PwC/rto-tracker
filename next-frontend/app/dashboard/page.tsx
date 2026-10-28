import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/api/session";
import RtoDashboard from "./rto-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "RTO dashboard" };

export const instant = false;

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("JSESSIONID")?.value;
  if (!sessionId) redirect("/login");

  const user = await getSessionUser(sessionId);
  if (!user) redirect("/login");
  if (!user.roles.includes("ADMIN") && !user.roles.includes("SUPER_ADMIN")) notFound();

  return <RtoDashboard />;
}
