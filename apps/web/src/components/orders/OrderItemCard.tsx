'use client';

import { useState } from 'react';
import type { OrderItem } from '@agent-crm/shared';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface OrderItemCardProps {
  item: OrderItem;
}

const SPEC_FIELDS: { key: keyof OrderItem; label: string }[] = [
  { key: 'width_cm', label: 'Width (cm)' },
  { key: 'drop_cm', label: 'Drop (cm)' },
  { key: 'room_name', label: 'Room' },
  { key: 'window_position', label: 'Window Position' },
  { key: 'fixing_type', label: 'Fixing Type' },
  { key: 'stack_direction', label: 'Stack Direction' },
  { key: 'lining_type', label: 'Lining' },
  { key: 'motorization', label: 'Motorization' },
  { key: 'notes', label: 'Notes' },
];

export function OrderItemCard({ item }: OrderItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const subtotal = item.qty * item.unit_price;
  const hasSpecs = SPEC_FIELDS.some((f) => item[f.key] != null);

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {hasSpecs && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="shrink-0 rounded p-0.5 hover:bg-accent"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            )}
            <span className="truncate text-sm font-medium">{item.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
            <span>
              {item.qty} x {formatCurrency(item.unit_price)}
            </span>
            <span className="font-medium text-foreground">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>

        {expanded && hasSpecs && (
          <div className="ml-6 mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 border-t pt-3 sm:grid-cols-2">
            {SPEC_FIELDS.filter((f) => item[f.key] != null).map((f) => (
              <div key={f.key} className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">{f.label}:</span>
                <span className="text-xs font-medium">{String(item[f.key])}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
