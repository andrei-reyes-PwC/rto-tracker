import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/api/session";
import LunchProcurement from "./lunch-procurement";

export const instant = false;

export default async function LunchPage({ searchParams }: PageProps<"/lunch">) {
  const sessionId = (await cookies()).get("JSESSIONID")?.value;
  if (!sessionId) redirect(`/login?next=${encodeURIComponent("/lunch")}`);
  const user = await getSessionUser(sessionId);
  if (!user) redirect(`/login?next=${encodeURIComponent("/lunch")}`);
  if (!user.roles.includes("LUNCH") && !user.roles.includes("SUPER_ADMIN")) notFound();
  const params = await searchParams;
  const parsedDate = typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
    ? new Date(`${params.date}T00:00:00Z`)
    : null;
  const date = parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === params.date
    ? params.date
    : undefined;
  const siteId = typeof params.siteId === "string" && /^\d+$/.test(params.siteId) ? params.siteId : undefined;
  return <LunchProcurement initialDate={date} initialSiteId={siteId} />;
}
