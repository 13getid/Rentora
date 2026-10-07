import { cn } from "../../lib/cn";

// Skeletons copy the SHAPE of the real component, so layout doesn't jump on load.
export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden="true" className={cn("rounded-sm bg-sand motion-safe:animate-pulse", className)} />
);

export function MetricBlockSkeleton({ hero }: { hero?: boolean }) {
  return (
    <div
      role="status"
      aria-label="Loading metric"
      className={cn(hero ? "border-2 border-line bg-paper p-6 md:p-8" : "border-t border-line pt-4")}
    >
      <Skeleton className="h-3 w-32" />
      <Skeleton className={cn("mt-5", hero ? "h-14 w-72" : "h-8 w-40")} />
      <Skeleton className="mt-3 h-3 w-44" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading table" className="border-t-2 border-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line py-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
