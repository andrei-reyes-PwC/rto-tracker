import type { ReactNode } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SidebarPageLayoutProps = {
  children: ReactNode;
  headerContent: ReactNode;
  className?: string;
  insetClassName?: string;
  defaultOpen?: boolean;
  managementTabs?: { active: "users" | "platforms" | "work-schedules" | "sites"; isSuperAdmin: boolean };
};

export default function SidebarPageLayout({
  children,
  headerContent,
  className,
  insetClassName,
  defaultOpen,
  managementTabs,
}: SidebarPageLayoutProps) {
  const tabs = [
    { id: "users", label: "Users", href: "/manage/users" },
    { id: "platforms", label: "Platforms", href: "/manage/platforms" },
    { id: "work-schedules", label: "Work schedules", href: "/manage/work-schedules" },
    { id: "sites", label: "Sites", href: "/manage/sites" },
  ] as const;
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen} className={cn("h-svh overflow-hidden", className)}>
        <Sidebar />
        <SidebarInset className={cn("min-h-0 min-w-0 overflow-hidden", insetClassName)}>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <div className="flex shrink-0 items-center gap-0.5">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border" />
            </div>
            {headerContent}
          </header>
          {managementTabs && <nav aria-label="People and assignments" className="flex shrink-0 gap-1 overflow-x-auto border-b px-4">
            {tabs.filter((tab) => managementTabs.isSuperAdmin || tab.id === "users").map((tab) => {
              const active = managementTabs.active === tab.id;
              return <Link key={tab.id} href={tab.href} aria-current={active ? "page" : undefined} className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${active ? "border-[#e65300] text-[#9f3300]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {tab.label}
              </Link>;
            })}
          </nav>}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
