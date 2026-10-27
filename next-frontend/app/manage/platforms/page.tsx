import { requireSuperAdmin } from "../authorization";
import PlatformManagement from "@/app/platforms/platform-management";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Platforms" };

export const instant = false;

export default async function ManagePlatformsPage() {
  await requireSuperAdmin();
  return <PlatformManagement />;
}
