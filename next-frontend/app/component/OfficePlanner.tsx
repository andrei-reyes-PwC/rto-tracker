"use client";

import DataLoadError from "@/components/DataLoadError";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import EventsRequirements from "@/app/component/EventsRequirements";
import MonthlyCalendar from "@/app/component/MonthlyCalendar";
import PlannerHeading from "@/app/component/PlannerHeading";
import PlannerSummary from "@/app/component/PlannerSummary";
import PlatformOfficeDays from "@/app/component/PlatformOfficeDays";
import { ScheduleProvider, useSchedule } from "@/app/component/ScheduleProvider";

function ScheduleContent() {
  const { isLoadingMonth, loadError, saveError, retryLoading } = useSchedule();

  return (
    <SidebarPageLayout
      headerContent={<span className="text-sm font-medium">My Schedule</span>}
      defaultOpen
      className="bg-[#f7f6f4] text-[#2d2926] lg:h-screen lg:min-h-0"
      insetClassName="min-h-screen lg:h-screen lg:min-h-0 lg:overflow-y-auto"
    >
      <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
        <PlannerHeading />
        {loadError && <DataLoadError message={loadError} onRetry={retryLoading} retrying={isLoadingMonth} />}
        {saveError && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{saveError} Your changes are still here; you can try saving again.</div>}
        <PlannerSummary />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <MonthlyCalendar />
          <div className="space-y-4">
            <PlatformOfficeDays />
            <EventsRequirements />
          </div>
        </div>
        <p className="pb-3 text-center text-xs text-slate-400">
          Your office days are saved to your work account.
        </p>
      </main>
    </SidebarPageLayout>
  );
}

export default function OfficePlanner() {
  return (
    <ScheduleProvider>
      <ScheduleContent />
    </ScheduleProvider>
  );
}
