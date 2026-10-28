import { requireSuperAdmin } from "../authorization";
import SiteManagement from "@/app/sites/site-management";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sites" };

export const instant = false;

export default async function ManageSitesPage() {
  await requireSuperAdmin();
  return <SiteManagement />;
}
