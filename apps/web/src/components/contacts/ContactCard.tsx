'use client';

import type { Contact } from '@agent-crm/shared';
import { cn } from '@/lib/utils';
import { getDisplayName, formatRelativeTime, formatCurrency } from '@/lib/format';

interface ContactCardProps {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
  dealValue?: number | null;
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  engaged: 'bg-amber-50 text-amber-700',
  qualified: 'bg-sky-50 text-sky-700',
  converted: 'bg-emerald-50 text-emerald-700',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  engaged: 'Engaged',
  qualified: 'Qualified',
  converted: 'Converted',
};

function truncate(text: string | null, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export function ContactCard({ contact, isSelected, onClick, dealValue }: ContactCardProps) {
  const tags = contact.tags ?? [];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-1.5 rounded-lg border-l-2 px-3 py-2.5 text-left transition-colors',
        isSelected
          ? 'border-l-amber-400 bg-accent'
          : 'border-l-transparent hover:bg-accent/50',
      )}
    >
      {/* Row 1: status badge + name + channel + time */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0 text-[9px] font-semibold',
            STATUS_BADGE_STYLES[contact.status] ?? 'bg-stone-50 text-stone-700',
          )}
        >
          {STATUS_LABELS[contact.status] ?? contact.status}
        </span>
        <span className="flex-1 truncate text-sm font-medium">
          {getDisplayName(contact)}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {contact.last_message_at && (
            <span className="text-[11px] text-muted-foreground">
              {formatRelativeTime(contact.last_message_at)}
            </span>
          )}
          <span
            className={cn(
              'rounded px-1 py-0 text-[9px] font-semibold',
              contact.channel === 'whatsapp'
                ? 'bg-green-50 text-green-700'
                : 'bg-blue-50 text-blue-700',
            )}
          >
            {contact.channel === 'whatsapp' ? 'WA' : 'TG'}
          </span>
        </div>
      </div>

      {/* Row 2: message preview */}
      <div>
        <span className="truncate text-xs text-muted-foreground">
          {truncate(contact.last_message_preview, 45) || 'No messages yet'}
        </span>
      </div>

      {/* Row 3: tags + deal value */}
      <div className="flex min-h-4 items-center gap-1.5">
        {tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-2 py-0 text-[10px] font-medium text-muted-foreground"
          >
            {tag}
          </span>
        ))}
        {tags.length > 2 && (
          <span className="text-[10px] text-muted-foreground">
            +{tags.length - 2}
          </span>
        )}
        {dealValue != null && dealValue > 0 && (
          <span className="ml-auto shrink-0 text-[11px] font-medium text-foreground">
            {formatCurrency(dealValue)}
          </span>
        )}
      </div>
    </button>
  );
}
