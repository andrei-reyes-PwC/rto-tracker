"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { initialsFromEmail } from "./utils";

export default function ProfileMenu() {
  const router = useRouter();
  const { user, logout, isLoggingOut } = useAuth();
  const email = user?.email ?? "";
  const [logoutError, setLogoutError] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  async function handleLogout() {
    setLogoutError("");
    const success = await logout();
    if (!success) {
      setLogoutError("Could not sign out. Please try again.");
      return;
    }
    setIsProfileMenuOpen(false);
    router.replace("/login");
    router.refresh();
  }

  return (
    <DropdownMenu open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="h-12" aria-label={email || "Account menu"}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ffe0cc] text-xs font-semibold text-[#b83b00]">
                {email ? initialsFromEmail(email) : "..."}
              </span>
              <span className="truncate text-sm font-medium" title={email || "Loading account"}>
                {email || "Loading account..."}
              </span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </SidebarMenuItem>
      </SidebarMenu>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="z-50 min-w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      >
        <DropdownMenuLabel className="max-w-64 break-all px-2 py-1.5 text-xs text-muted-foreground">
          {email || "Account"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-border" />
        <DropdownMenuItem
          disabled={isLoggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
          className="flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <LogOut className="size-4" aria-hidden="true" />
          {isLoggingOut ? "Signing out..." : "Log out"}
        </DropdownMenuItem>
        {logoutError && (
          <p role="alert" className="px-2 py-1.5 text-xs text-destructive">
            {logoutError}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
