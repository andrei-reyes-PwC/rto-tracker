import { requireManagementUser } from "../authorization";
import UserManagement from "@/app/users/user-management";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users" };

export const instant = false;

export default async function ManageUsersPage() {
  const user = await requireManagementUser();
  const isSuperAdmin = user.roles.includes("SUPER_ADMIN");
  return <UserManagement readOnly={!isSuperAdmin} platformName={user.platform?.name} />;
}
