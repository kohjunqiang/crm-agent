'use client';

import type { OrderStageConfig, OrderStageHistory } from '@agent-crm/shared';
import { cn } from '@/lib/utils';

interface OrderStagePipelineProps {
  stages: OrderStageConfig[];
  currentStage: string;
  history: OrderStageHistory[];
}

export function OrderStagePipeline({
  stages,
  currentStage,
  history,
}: OrderStagePipelineProps) {
  const currentIndex = stages.findIndex((s) => s.name === currentStage);

  function getStageDate(stageName: string): string | null {
    const entry = history.find((h) => h.to_stage === stageName);
    return entry ? new Date(entry.created_at).toLocaleDateString() : null;
  }

  // Desktop: horizontal timeline with dots and labels
  // Mobile: compact progress bar
  return (
    <>
      {/* Desktop timeline */}
      <div className="hidden items-start gap-0 overflow-x-auto py-2 sm:flex">
        {stages.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const date = getStageDate(stage.name);

          return (
            <div key={stage.id} className="flex items-start">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors',
                    isCompleted && 'border-transparent text-white',
                    isCurrent && 'border-current ring-2 ring-offset-2',
                    !isCompleted &&
                      !isCurrent &&
                      'border-muted-foreground/30 text-muted-foreground/50',
                  )}
                  style={{
                    backgroundColor: isCompleted ? stage.color : undefined,
                    borderColor: isCurrent ? stage.color : undefined,
                    color: isCurrent ? stage.color : undefined,
                    ...((isCurrent ? { '--tw-ring-color': stage.color } : {}) as React.CSSProperties),
                  }}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'max-w-[80px] text-center text-[10px] leading-tight',
                    isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {stage.name}
                </span>
                {date && (
                  <span className="text-[9px] text-muted-foreground">{date}</span>
                )}
              </div>
              {i < stages.length - 1 && (
                <div
                  className={cn(
                    'mt-3.5 h-0.5 w-8 sm:w-12',
                    i < currentIndex ? 'bg-muted-foreground/40' : 'bg-muted-foreground/15',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact progress bar */}
      <div className="flex flex-col gap-1.5 py-2 sm:hidden">
        <div className="flex items-center gap-1.5">
          {stages.map((stage, i) => {
            const isCompleted = i < currentIndex;
            const isCurrent = i === currentIndex;

            return (
              <div
                key={stage.id}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  isCompleted || isCurrent ? '' : 'bg-muted',
                )}
                style={{
                  backgroundColor: isCompleted || isCurrent ? stage.color : undefined,
                  opacity: isCurrent ? 0.6 : undefined,
                }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">
            {currentStage}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Step {currentIndex + 1} of {stages.length}
          </span>
        </div>
      </div>
    </>
  );
}
