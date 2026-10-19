"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileMenuButton } from "@/components/Sidebar";

type PlannerHeadingProps = {
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onOpenNavigation: () => void;
};

export default function PlannerHeading({ hasUnsavedChanges, onSave, onOpenNavigation }: PlannerHeadingProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <MobileMenuButton onClick={onOpenNavigation} />
        <p className="text-xs font-medium uppercase tracking-wide text-[#c74600]">Workplace planner</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">Plan your office days</h2>
        <p className="mt-1.5 text-sm text-slate-500">Choose the days you're heading in. Your schedule is saved on this device.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
        <span aria-live="polite" className="text-xs font-medium text-slate-500">{hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}</span>
        <Button onClick={onSave} className="gap-2 bg-[#e65300] text-white shadow-sm hover:bg-[#c74600]"><Save className="size-4" /> Save schedule</Button>
      </div>
    </div>
  );
}
