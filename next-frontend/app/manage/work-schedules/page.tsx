import { requireSuperAdmin } from "../authorization";
import WorkScheduleManagement from "@/app/work-schedules/work-schedule-management";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Work schedules" };

export const instant = false;

export default async function ManageWorkSchedulesPage() {
  await requireSuperAdmin();
  return <WorkScheduleManagement />;
}
