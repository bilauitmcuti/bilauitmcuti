import { Skeleton } from "@/components/ui/skeleton";

function CalendarHeaderSkeleton() {
  return (
    <div className="flex flex-col items-start gap-2">
      <Skeleton className="h-7 w-14 rounded-full" />
      <Skeleton className="h-12 w-[290px] sm:w-[410px]" />
      <div className="mt-1 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

function CalendarControlsSkeleton() {
  return (
    <div className="mt-6 rounded-xl p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-[190px]" />
        <Skeleton className="h-10 w-[130px]" />
        <Skeleton className="h-10 w-[130px]" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-full max-w-[130px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarGridSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, monthIndex) => (
        <div key={monthIndex} className="rounded-lg p-4">
          <Skeleton className="mb-3 h-6 w-36" />
          <div className="mb-3 grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, dayLabel) => (
              <Skeleton key={dayLabel} className="h-4 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, dayCell) => (
              <Skeleton key={dayCell} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-4">
        <CalendarHeaderSkeleton />
        <CalendarControlsSkeleton />
        <CalendarGridSkeleton />
      </div>
    </div>
  );
}
