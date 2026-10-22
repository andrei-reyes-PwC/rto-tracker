import type { ReactNode } from "react";
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
};

export default function SidebarPageLayout({
  children,
  headerContent,
  className,
  insetClassName,
  defaultOpen,
}: SidebarPageLayoutProps) {
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
          <div className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
