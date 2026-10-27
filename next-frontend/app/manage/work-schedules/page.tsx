import { requireSuperAdmin } from "../authorization";
import WorkScheduleManagement from "@/app/work-schedules/work-schedule-management";

export const instant = false;

export default async function ManageWorkSchedulesPage() {
  await requireSuperAdmin();
  return <WorkScheduleManagement />;
}
