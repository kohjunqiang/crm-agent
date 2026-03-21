'use client';

import { useState, useMemo } from 'react';
import type { Order, OrderStageConfig, Contact, Payment } from '@agent-crm/shared';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Package,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { OrderFilters } from './OrderFilters';
import { OrderKPICards } from './OrderKPICards';

type OrderWithMeta = Order & { contact_name: string | null; item_count: number };

interface OrderListProps {
  orders: OrderWithMeta[];
  stages: OrderStageConfig[];
  contacts: Contact[];
  payments: Payment[];
}

function getPaymentStatus(
  order: Order,
  payments: Payment[],
): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  const dealPayments = payments.filter((p) => p.deal_id === order.deal_id);
  const totalPaid = dealPayments.reduce((sum, p) => sum + p.amount, 0);
  if (totalPaid <= 0) return { label: 'Unpaid', variant: 'outline' };
  if (totalPaid >= order.total_amount) return { label: 'Paid', variant: 'default' };
  return { label: 'Partial', variant: 'secondary' };
}

export function OrderList({ orders, stages, contacts, payments }: OrderListProps) {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const stage of stages) {
      if (orders.some((o) => o.stage === stage.name)) initial.add(stage.name);
    }
    return initial;
  });

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.order_number.toLowerCase().includes(q) ||
          (o.contact_name && o.contact_name.toLowerCase().includes(q)),
      );
    }
    if (stageFilter !== 'all') {
      result = result.filter((o) => o.stage === stageFilter);
    }
    if (clientFilter !== 'all') {
      result = result.filter((o) => o.contact_id === clientFilter);
    }
    if (dateFrom) {
      result = result.filter((o) => o.created_at >= dateFrom);
    }
    if (dateTo) {
      const toEnd = dateTo + 'T23:59:59';
      result = result.filter((o) => o.created_at <= toEnd);
    }
    return result;
  }, [orders, search, stageFilter, clientFilter, dateFrom, dateTo]);

  const toggleStage = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No orders yet. Orders are created automatically when a deal moves to
          the &ldquo;Ordered&rdquo; stage.
        </p>
        <Link
          href="/clients"
          className="text-sm font-medium text-primary hover:underline"
        >
          Go to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <OrderKPICards stages={stages} orders={orders} />

      <OrderFilters
        stages={stages}
        contacts={contacts}
        search={search}
        onSearchChange={setSearch}
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
        clientFilter={clientFilter}
        onClientFilterChange={setClientFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
      />

      <div className="flex flex-col gap-2">
        {stages.map((stage) => {
          const stageOrders = filteredOrders.filter((o) => o.stage === stage.name);
          const total = stageOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
          const isExpanded = expanded.has(stage.name);

          return (
            <div key={stage.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => toggleStage(stage.name)}
                className="flex items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
              >
                {stageOrders.length > 0 ? (
                  isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )
                ) : (
                  <div className="h-3.5 w-3.5 shrink-0" />
                )}
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span
                  className={cn(
                    'text-sm',
                    stageOrders.length > 0
                      ? 'font-medium'
                      : 'text-muted-foreground',
                  )}
                >
                  {stage.name}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {stageOrders.length > 0
                    ? `${stageOrders.length} · ${formatCurrency(total)}`
                    : '0'}
                </span>
              </button>

              {isExpanded && stageOrders.length > 0 && (
                <div className="ml-6 flex flex-col gap-1.5 pb-2 pt-1">
                  {stageOrders.map((order) => {
                    const payStatus = getPaymentStatus(order, payments);

                    return (
                      <Link
                        key={order.id}
                        href={`/orders/${order.id}`}
                        className="flex items-center gap-3 rounded-md border bg-card px-3 py-2.5 transition-colors hover:bg-accent/50"
                        style={{ borderLeftWidth: 3, borderLeftColor: stage.color }}
                      >
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-foreground"
                          title={order.contact_name ?? undefined}
                        >
                          {(order.contact_name ?? '?')
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((w) => w[0]?.toUpperCase() ?? '')
                            .join('')}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {order.title}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {order.order_number}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">
                              {order.contact_name ?? 'Unknown'}
                            </span>
                            {order.item_count > 0 && (
                              <>
                                <span>·</span>
                                <span className="flex shrink-0 items-center gap-0.5">
                                  <Package className="h-3 w-3" />
                                  {order.item_count}
                                </span>
                              </>
                            )}
                            {order.delivery_date && (
                              <>
                                <span>·</span>
                                <span className="shrink-0">
                                  {new Date(order.delivery_date).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={payStatus.variant} className="text-[10px]">
                            {payStatus.label}
                          </Badge>
                          <span className="text-sm font-medium">
                            {formatCurrency(order.total_amount)}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
