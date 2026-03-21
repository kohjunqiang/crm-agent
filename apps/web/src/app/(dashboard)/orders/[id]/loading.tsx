import { Card, CardContent } from '@/components/ui/card';

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />;
}

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SkeletonPulse className="h-8 w-8 rounded-md" />
        <div className="flex flex-col gap-1">
          <SkeletonPulse className="h-6 w-48" />
          <SkeletonPulse className="h-4 w-20" />
        </div>
      </div>

      {/* Stage pipeline skeleton */}
      <div className="flex items-center gap-3 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonPulse className="h-8 w-8 rounded-full" />
            {i < 3 && <SkeletonPulse className="h-0.5 w-12" />}
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-3 md:col-span-2">
          {/* Line items */}
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="flex flex-col gap-2 p-4">
              <SkeletonPulse className="h-4 w-24" />
              <SkeletonPulse className="h-12 w-full" />
              <SkeletonPulse className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          {/* Sidebar cards */}
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="gap-0 py-0 shadow-none">
              <CardContent className="p-4">
                <SkeletonPulse className="mb-2 h-3 w-16" />
                <SkeletonPulse className="h-5 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
