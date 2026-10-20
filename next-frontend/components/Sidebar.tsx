"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, CalendarDays, Users } from "lucide-react";
import ProfileMenu from "@/components/sidebar/ProfileMenu";
import { useAuth } from "@/providers/AuthProvider";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

export default function Sidebar() {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuth();
  const canManageUsers = user?.roles.includes("SUPER_ADMIN") ?? false;

  return (
    <ShadcnSidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="AC Manila" className="h-12">
              <Link href="/" aria-label="AC Manila RTO planner home">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e65300] text-[10px] font-bold text-white">PwC</span>
                <span className="truncate text-[15px] font-semibold tracking-tight">AC Manila</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="My schedule">
                <Link href="/" onClick={() => setOpenMobile(false)} aria-label="My schedule">
                  <CalendarDays />
                  <span>My schedule</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {canManageUsers && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/users" || pathname.startsWith("/users/")} tooltip="Manage users">
                  <Link href="/users" onClick={() => setOpenMobile(false)} aria-label="Manage users">
                    <Users />
                    <span>Manage users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {canManageUsers && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/platforms" || pathname.startsWith("/platforms/")} tooltip="Manage platforms">
                  <Link href="/platforms" onClick={() => setOpenMobile(false)} aria-label="Manage platforms">
                    <Boxes />
                    <span>Manage platforms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 p-2">
        <SidebarSeparator />
        <ProfileMenu />
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
