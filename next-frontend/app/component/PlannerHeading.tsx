"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchedule } from "@/app/component/ScheduleProvider";
import PageHeading from "@/components/PageHeading";

export default function PlannerHeading() {
  const { hasUnsavedChanges, isLoadingMonth, isSaving, saveSchedule } = useSchedule();
  const status = isLoadingMonth
    ? "Loading schedule..."
    : isSaving
      ? "Saving schedule..."
      : hasUnsavedChanges
        ? "Unsaved changes"
        : "All changes saved";

  return (
    <PageHeading category="Workplace planner" title="Plan your office days" description="Choose the days you’re heading in. Your schedule is saved to your account."
      actions={<div className="flex flex-wrap items-center gap-3">
        {isLoadingMonth ? <Skeleton role="status" aria-label="Loading schedule status" className="h-4 w-28" /> : <span aria-live="polite" className="text-xs font-medium text-slate-500">{status}</span>}
        <Button onClick={saveSchedule} disabled={!hasUnsavedChanges || isLoadingMonth || isSaving} className="gap-2 bg-[#e65300] text-white shadow-sm hover:bg-[#c74600]"><Save className="size-4" /> {isSaving ? "Saving..." : "Save schedule"}</Button>
      </div>}
    />
  );
}
