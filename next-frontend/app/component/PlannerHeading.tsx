"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type PlannerHeadingProps = {
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
};

export default function PlannerHeading({ hasUnsavedChanges, isLoading, isSaving, onSave }: PlannerHeadingProps) {
  const status = isLoading
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
        <p className="mt-1.5 text-sm text-slate-500">Choose the days you're heading in. Your schedule is saved to your account.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
        <span aria-live="polite" className="text-xs font-medium text-slate-500">{status}</span>
        <Button onClick={onSave} disabled={!hasUnsavedChanges || isLoading || isSaving} className="gap-2 bg-[#e65300] text-white shadow-sm hover:bg-[#c74600]"><Save className="size-4" /> {isSaving ? "Saving..." : "Save schedule"}</Button>
      </div>
    </div>
  );
}
