'use client';

import type { Order, OrderStageConfig } from '@agent-crm/shared';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';

interface OrderKPICardsProps {
  stages: OrderStageConfig[];
  orders: Order[];
}

export function OrderKPICards({ stages, orders }: OrderKPICardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stages.map((stage) => {
        const stageOrders = orders.filter((o) => o.stage === stage.name);
        const total = stageOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

        return (
          <Card key={stage.id} className="gap-0 py-0 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="truncate text-[11px] text-muted-foreground">
                  {stage.name}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-semibold tracking-tight">
                  {stageOrders.length}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatCurrency(total)}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
