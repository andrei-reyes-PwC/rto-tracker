"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, CalendarDays, CalendarRange, Users } from "lucide-react";
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
  const isSuperAdmin = user?.roles.includes("SUPER_ADMIN") ?? false;
  const canViewRtoDashboard = isSuperAdmin || (user?.roles.includes("ADMIN") ?? false);
  const canManageEvents = isSuperAdmin || ((user?.roles.includes("ADMIN") ?? false) && user?.platform !== null);
  const canViewUsers = isSuperAdmin || ((user?.roles.includes("ADMIN") ?? false) && user?.platform !== null);

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
          </SidebarMenu>
        </SidebarGroup>
        {canViewRtoDashboard && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarMenu>
              {canViewRtoDashboard && <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard" || pathname.startsWith("/dashboard/")} tooltip="RTO dashboard">
                  <Link href="/dashboard" onClick={() => setOpenMobile(false)} aria-label="RTO dashboard">
                    <BarChart3 />
                    <span>RTO dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>}
              {canViewUsers && <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/users" || pathname.startsWith("/users/")} tooltip="Manage users">
                  <Link href="/users" onClick={() => setOpenMobile(false)} aria-label="Manage users">
                    <Users />
                    <span>Manage users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>}
              {isSuperAdmin && <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/platforms" || pathname.startsWith("/platforms/")} tooltip="Manage platforms">
                  <Link href="/platforms" onClick={() => setOpenMobile(false)} aria-label="Manage platforms">
                    <Boxes />
                    <span>Manage platforms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/work-schedules" || pathname.startsWith("/work-schedules/")} tooltip="Manage work schedules">
                  <Link href="/work-schedules" onClick={() => setOpenMobile(false)} aria-label="Manage work schedules">
                    <CalendarDays />
                    <span>Manage work schedules</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              </>}
              {canManageEvents && <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/events" || pathname.startsWith("/events/")} tooltip="Manage events">
                  <Link href="/events" onClick={() => setOpenMobile(false)} aria-label="Manage events">
                    <CalendarRange />
                    <span>Manage events</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="gap-2 p-2">
        <SidebarSeparator />
        <ProfileMenu />
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
