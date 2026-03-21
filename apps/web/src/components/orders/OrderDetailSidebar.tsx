'use client';

import type { Order, Payment, OrderStageHistory } from '@agent-crm/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { User, FileText, Clock } from 'lucide-react';

interface OrderDetailSidebarProps {
  order: Order & { contact_name: string | null };
  payments: Payment[];
  history: OrderStageHistory[];
}

export function OrderDetailSidebar({
  order,
  payments,
  history,
}: OrderDetailSidebarProps) {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidPercent =
    order.total_amount > 0
      ? Math.min(100, Math.round((totalPaid / order.total_amount) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Client card */}
      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="px-4 pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold">
            <User className="h-3.5 w-3.5" />
            Client
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <Link
            href={`/clients?contact=${order.contact_id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {order.contact_name ?? 'Unknown'}
          </Link>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="px-4 pb-2 pt-3">
          <CardTitle className="flex items-center justify-between text-xs font-semibold">
            <span>Payments</span>
            <span className="font-normal text-muted-foreground">
              {formatCurrency(totalPaid)} / {formatCurrency(order.total_amount)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {paidPercent}% paid
          </p>
          {payments.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">
                    {p.label ?? 'Payment'}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deal link */}
      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="px-4 pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold">
            <FileText className="h-3.5 w-3.5" />
            Linked Deal
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <Link
            href={`/clients?contact=${order.contact_id}&deal=${order.deal_id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {order.title}
          </Link>
        </CardContent>
      </Card>

      {/* Stage history */}
      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="px-4 pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" />
            Stage History
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No history yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((h) => (
                <div key={h.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-xs">
                    {h.from_stage ? (
                      <>
                        <span className="text-muted-foreground">
                          {h.from_stage}
                        </span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="font-medium">{h.to_stage}</span>
                      </>
                    ) : (
                      <span className="font-medium">{h.to_stage}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{formatRelativeTime(h.created_at)}</span>
                    {h.notes && <span>· {h.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
