"use client";

import { CalendarDays } from "lucide-react";
import ProfileMenu from "@/components/sidebar/ProfileMenu";
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

  return (
    <ShadcnSidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="AC Manila" className="h-12">
              <a href="#calendar" aria-label="AC Manila RTO planner home">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e65300] text-[10px] font-bold text-white">PwC</span>
                <span className="truncate text-[15px] font-semibold tracking-tight">AC Manila</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive tooltip="My schedule">
                <a href="#calendar" onClick={() => setOpenMobile(false)} aria-label="My schedule">
                  <CalendarDays />
                  <span>My schedule</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
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
