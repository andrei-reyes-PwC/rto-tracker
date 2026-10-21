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
      <SidebarProvider defaultOpen={defaultOpen} className={cn("min-h-svh", className)}>
        <Sidebar />
        <SidebarInset className={cn("min-w-0", insetClassName)}>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border" />
            {headerContent}
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
