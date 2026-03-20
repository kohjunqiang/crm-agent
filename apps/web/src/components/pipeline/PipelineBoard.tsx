'use client';

import { useState } from 'react';
import type { Deal, DealStage, Contact } from '@agent-crm/shared';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  DollarSign,
  Package,
} from 'lucide-react';
import { formatCurrency, getContactName } from '@/lib/format';
import { ACTIVE_STAGES, STAGE_LABELS, STAGE_BAR_COLORS, STAGE_BORDER_COLORS } from '@/lib/stages';

interface PipelineBoardProps {
  deals: Deal[];
  contacts: Contact[];
}

export function PipelineBoard({ deals, contacts }: PipelineBoardProps) {
  const activeDeals = deals.filter(
    (d) => d.stage !== 'completed' && d.stage !== 'lost',
  );

  const stageData = ACTIVE_STAGES.map((stage) => {
    const stageDeals = activeDeals.filter((d) => d.stage === stage);
    const total = stageDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0);
    return { stage, deals: stageDeals, total };
  });

  const maxCount = Math.max(...stageData.map((s) => s.deals.length), 1);

  // Auto-expand stages that have deals
  const [expanded, setExpanded] = useState<Set<DealStage>>(() => {
    const initial = new Set<DealStage>();
    for (const s of stageData) {
      if (s.deals.length > 0) initial.add(s.stage);
    }
    return initial;
  });

  const toggleStage = (stage: DealStage) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="px-5 pb-2 pt-4">
        <CardTitle className="text-sm font-semibold">Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-5 pb-4">
        {activeDeals.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No active deals.
          </p>
        ) : (
          stageData.map(({ stage, deals: stageDeals, total }) => (
            <div key={stage} className="flex flex-col">
              {/* Stage row — clickable */}
              <button
                type="button"
                onClick={() => toggleStage(stage)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50"
              >
                {stageDeals.length > 0 ? (
                  expanded.has(stage) ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )
                ) : (
                  <div className="h-3.5 w-3.5 shrink-0" />
                )}
                <span
                  className={cn(
                    'w-28 shrink-0 text-left text-xs',
                    stageDeals.length > 0 ? 'font-medium' : 'text-muted-foreground',
                  )}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  {stageDeals.length > 0 && (
                    <div
                      className={cn('h-2 rounded-full', STAGE_BAR_COLORS[stage])}
                      style={{
                        width: `${(stageDeals.length / maxCount) * 100}%`,
                      }}
                    />
                  )}
                </div>
                <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                  {stageDeals.length > 0
                    ? `${stageDeals.length} · ${formatCurrency(total)}`
                    : '0'}
                </span>
              </button>

              {/* Expanded deal cards */}
              {expanded.has(stage) && stageDeals.length > 0 && (
                <div className="ml-8 flex flex-col gap-1.5 pb-2 pt-1">
                  {stageDeals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/conversations?contact=${deal.contact_id}`}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-md border-l-2 bg-card px-3 py-2 text-sm transition-colors hover:bg-accent/50',
                        STAGE_BORDER_COLORS[stage],
                      )}
                    >
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-medium">
                          {deal.title}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">
                            {getContactName(contacts, deal.contact_id)}
                          </span>
                          <span className="shrink-0">·</span>
                          <span className="flex shrink-0 items-center gap-0.5 font-medium text-foreground">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(deal.amount)}
                          </span>
                        </div>
                      </div>
                      {deal.products?.length > 0 && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          <Package className="h-2.5 w-2.5" />
                          {deal.products.length}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
