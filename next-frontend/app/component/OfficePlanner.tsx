"use client";

import DataLoadError from "@/components/DataLoadError";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import EventsRequirements from "@/app/component/EventsRequirements";
import MonthlyCalendar from "@/app/component/MonthlyCalendar";
import PlannerHeading from "@/app/component/PlannerHeading";
import PlannerSummary from "@/app/component/PlannerSummary";
import PlatformOfficeDays from "@/app/component/PlatformOfficeDays";
import RtoAssistant from "@/app/component/RtoAssistant";
import { ScheduleProvider, useSchedule } from "@/app/component/ScheduleProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function OfficePlannerLoading() {
  return <SidebarPageLayout headerContent={<span className="text-sm font-medium">My Schedule</span>} defaultOpen
    className="bg-[#f7f6f4] text-[#2d2926] lg:h-screen lg:min-h-0"
    insetClassName="min-h-screen lg:h-screen lg:min-h-0 lg:overflow-y-auto">
    <main role="status" aria-label="Loading planner" aria-busy="true" className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
      <div className="space-y-3"><Skeleton className="h-3 w-32" /><Skeleton className="h-9 w-72 max-w-full" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <Card key={item} className="shadow-none"><CardContent className="space-y-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-7 w-36" /><Skeleton className="h-3 w-28" /></CardContent></Card>)}</div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <Card className="shadow-none"><CardContent className="space-y-5"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-full" /><div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }, (_, index) => <Skeleton key={index} className="h-[78px] sm:h-[112px]" />)}</div></CardContent></Card>
        <div className="space-y-4">{[0, 1].map((item) => <Card key={item} className="shadow-none"><CardContent className="space-y-4"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-full" /><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>
      </div>
    </main>
  </SidebarPageLayout>;
}

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
        {saveError && <DataLoadError message={`${saveError} Your unsaved changes are still here. Reload to check the latest schedule and day-off rules.`} onRetry={retryLoading} retrying={isLoadingMonth} />}
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
      <RtoAssistant />
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
