import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/api/session";
import LunchProcurement from "./lunch-procurement";

export const instant = false;

export default async function LunchPage() {
  const sessionId = (await cookies()).get("JSESSIONID")?.value;
  if (!sessionId) redirect("/login");
  const user = await getSessionUser(sessionId);
  if (!user) redirect("/login");
  if (!user.roles.includes("LUNCH") && !user.roles.includes("SUPER_ADMIN")) notFound();
  return <LunchProcurement />;
}
