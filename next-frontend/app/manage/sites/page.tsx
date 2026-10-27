import { requireSuperAdmin } from "../authorization";
import SiteManagement from "@/app/sites/site-management";

export const instant = false;

export default async function ManageSitesPage() {
  await requireSuperAdmin();
  return <SiteManagement />;
}
