import { Card, CardContent } from '@/components/ui/card';

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />;
}

export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-6 w-24" />
        <SkeletonPulse className="h-8 w-32" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="gap-0 py-0 shadow-none">
            <CardContent className="p-4">
              <SkeletonPulse className="mb-2 h-3 w-20" />
              <SkeletonPulse className="h-6 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-2">
        <SkeletonPulse className="h-9 flex-1" />
        <SkeletonPulse className="h-9 w-[160px]" />
        <SkeletonPulse className="h-9 w-[160px]" />
      </div>

      {/* Order rows skeleton */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <SkeletonPulse className="h-9 w-full" />
            <div className="ml-6 flex flex-col gap-1.5">
              <SkeletonPulse className="h-14 w-full" />
              <SkeletonPulse className="h-14 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
