"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchedule } from "@/app/component/ScheduleProvider";

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
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-[#c74600]">Workplace planner</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">Plan your office days</h2>
        <p className="mt-1.5 text-sm text-slate-500">Choose the days you&apos;re heading in. Your schedule is saved to your account.</p>
      </div>
      <div className="flex flex-wrap items-center justify-start gap-3 self-start sm:ml-auto sm:flex-nowrap sm:justify-end sm:self-auto">
        {isLoadingMonth ? <Skeleton role="status" aria-label="Loading schedule status" className="h-4 w-28" /> : <span aria-live="polite" className="text-xs font-medium text-slate-500">{status}</span>}
        <Button onClick={saveSchedule} disabled={!hasUnsavedChanges || isLoadingMonth || isSaving} className="gap-2 bg-[#e65300] text-white shadow-sm hover:bg-[#c74600]"><Save className="size-4" /> {isSaving ? "Saving..." : "Save schedule"}</Button>
      </div>
    </div>
  );
}
