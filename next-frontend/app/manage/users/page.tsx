import { requireManagementUser } from "../authorization";
import UserManagement from "@/app/users/user-management";

export const instant = false;

export default async function ManageUsersPage() {
  const user = await requireManagementUser();
  const isSuperAdmin = user.roles.includes("SUPER_ADMIN");
  return <UserManagement readOnly={!isSuperAdmin} platformName={user.platform?.name} />;
}
