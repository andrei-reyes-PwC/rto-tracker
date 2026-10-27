import { requireSuperAdmin } from "../authorization";
import PlatformManagement from "@/app/platforms/platform-management";

export const instant = false;

export default async function ManagePlatformsPage() {
  await requireSuperAdmin();
  return <PlatformManagement />;
}
