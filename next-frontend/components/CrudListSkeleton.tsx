import { Skeleton } from "@/components/ui/skeleton";

export default function CrudListSkeleton({ label = "Loading records", rows = 5 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className="divide-y">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-4 w-2/3 max-w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Skeleton className="h-9 flex-1 sm:w-20" />
            <Skeleton className="size-9 sm:w-9" />
          </div>
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
