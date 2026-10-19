"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onMobileOpenChange: (open: boolean) => void;
};

function Profile({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center border-t border-slate-200 pt-4 ${compact ? "justify-center" : "gap-3 px-2"}`}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ffe0cc] text-xs font-semibold text-[#b83b00]">
        AR
      </div>
      {!compact && <span className="text-sm font-medium text-slate-700">My profile</span>}
    </div>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      className="mb-3 h-9 gap-2 border-slate-300 bg-white px-3 text-slate-700 shadow-sm lg:hidden"
      aria-label="Open navigation menu"
      onClick={onClick}
    >
      <Menu className="size-4" /> Menu
    </Button>
  );
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCollapsedChange,
  onMobileOpenChange,
}: SidebarProps) {
  return (
    <>
      <aside className={`sticky top-0 hidden h-screen shrink-0 self-start border-r border-slate-200/80 bg-white py-6 transition-[width,padding] duration-200 lg:flex lg:flex-col ${collapsed ? "w-[76px] px-3" : "w-[238px] px-5"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          <a href="#calendar" className={`flex items-center gap-3 ${collapsed ? "px-0" : "px-1"}`} aria-label="PwC RTO planner home">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e65300] text-xs font-bold text-white">PwC</span>
            {!collapsed && <span className="text-[15px] font-semibold tracking-tight">AC Manila</span>}
          </a>
          {!collapsed && <Button variant="ghost" size="icon" aria-label="Collapse navigation" onClick={() => onCollapsedChange(true)}><ChevronsLeft className="size-4" /></Button>}
        </div>
        {collapsed && <Button variant="ghost" size="icon" aria-label="Expand navigation" onClick={() => onCollapsedChange(false)} className="mx-auto mt-5"><ChevronsRight className="size-4" /></Button>}
        <div className="mt-10">
          {!collapsed && <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>}
          <nav aria-label="Workspace" className="mt-3 space-y-1 text-sm">
            <a href="#calendar" title={collapsed ? "My schedule" : undefined} aria-label="My schedule" className={`flex items-center gap-3 rounded-lg py-2.5 font-medium ${collapsed ? "justify-center px-0" : "px-3"} bg-[#fff0e6] text-[#b83b00]`}>
              <CalendarDays className="size-4 shrink-0" /> {!collapsed && "My schedule"}
            </a>
          </nav>
        </div>
        <div className="mt-auto"><Profile compact={collapsed} /></div>
      </aside>

      {mobileOpen && <button aria-label="Close navigation" onClick={() => onMobileOpenChange(false)} className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200 bg-white px-5 py-6 shadow-xl transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} aria-label="Mobile navigation" aria-hidden={!mobileOpen}>
        <div className="flex items-center justify-between">
          <a href="#calendar" className="flex items-center gap-3" onClick={() => onMobileOpenChange(false)}>
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#e65300] text-xs font-bold text-white">PwC</span>
            <span className="text-[15px] font-semibold tracking-tight">People &amp; Workplace</span>
          </a>
          <Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => onMobileOpenChange(false)}><ChevronLeft className="size-4" /></Button>
        </div>
        <div className="mt-10">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          <nav aria-label="Workspace" className="mt-3 space-y-1 text-sm">
            <a href="#calendar" onClick={() => onMobileOpenChange(false)} className="flex items-center gap-3 rounded-lg bg-[#fff0e6] px-3 py-2.5 font-medium text-[#b83b00]"><CalendarDays className="size-4" /> My schedule</a>
          </nav>
        </div>
        <div className="mt-auto"><Profile /></div>
      </aside>
    </>
  );
}
