'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Order,
  OrderItem,
  OrderStageConfig,
  OrderStageHistory,
  Payment,
} from '@agent-crm/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pencil, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { OrderStagePipeline } from './OrderStagePipeline';
import { OrderItemCard } from './OrderItemCard';
import { OrderDetailSidebar } from './OrderDetailSidebar';
import { OrderEditDialog } from './OrderEditDialog';
import { OrderAdvanceDialog } from './OrderAdvanceDialog';
import { formatCurrency } from '@/lib/format';

interface OrderDetailViewProps {
  order: Order & { contact_name: string | null };
  items: OrderItem[];
  stages: OrderStageConfig[];
  history: OrderStageHistory[];
  payments: Payment[];
}

export function OrderDetailView({
  order,
  items,
  stages,
  history,
  payments,
}: OrderDetailViewProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);

  const currentIndex = stages.findIndex((s) => s.name === order.stage);
  const isLastStage = currentIndex === stages.length - 1;
  const nextStage = isLastStage ? null : stages[currentIndex + 1];

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">{order.title}</h1>
            <p className="text-sm text-muted-foreground">{order.order_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          {!isLastStage && nextStage && (
            <Button size="sm" onClick={() => setAdvanceOpen(true)}>
              Advance to {nextStage.name}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Stage pipeline */}
      <OrderStagePipeline
        stages={stages}
        currentStage={order.stage}
        history={history}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-3 md:col-span-2">
          {/* Line items */}
          <Card className="gap-0 py-0 shadow-none">
            <CardHeader className="px-4 pb-2 pt-3">
              <CardTitle className="text-sm font-semibold">
                Line Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4 pb-3">
              {items.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  No items
                </p>
              ) : (
                items.map((item) => (
                  <OrderItemCard key={item.id} item={item} />
                ))
              )}
              <div className="flex justify-end border-t pt-2">
                <span className="text-sm font-semibold">
                  Total: {formatCurrency(order.total_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery info */}
          {(order.delivery_address ||
            order.delivery_date ||
            order.assigned_to ||
            order.delivery_notes) && (
            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="px-4 pb-2 pt-3">
                <CardTitle className="text-sm font-semibold">
                  Delivery Info
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2 px-4 pb-3 sm:grid-cols-2">
                {order.delivery_address && (
                  <div>
                    <span className="text-xs text-muted-foreground">Address</span>
                    <p className="text-sm">{order.delivery_address}</p>
                  </div>
                )}
                {order.delivery_date && (
                  <div>
                    <span className="text-xs text-muted-foreground">Date</span>
                    <p className="text-sm">
                      {new Date(order.delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {order.assigned_to && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Assigned Installer
                    </span>
                    <p className="text-sm">{order.assigned_to}</p>
                  </div>
                )}
                {order.delivery_notes && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-muted-foreground">Notes</span>
                    <p className="text-sm">{order.delivery_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order notes */}
          {order.notes && (
            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="px-4 pb-2 pt-3">
                <CardTitle className="text-sm font-semibold">Notes</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="whitespace-pre-wrap text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <OrderDetailSidebar
            order={order}
            payments={payments}
            history={history}
          />
        </div>
      </div>

      {/* Dialogs */}
      <OrderEditDialog
        key={order.id + order.updated_at}
        order={order}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={refresh}
      />
      {nextStage && (
        <OrderAdvanceDialog
          orderId={order.id}
          currentStage={order.stage}
          nextStage={nextStage.name}
          open={advanceOpen}
          onOpenChange={setAdvanceOpen}
          onAdvanced={refresh}
        />
      )}
    </div>
  );
}
