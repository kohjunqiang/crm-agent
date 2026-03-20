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

const STATUS_DOT_COLORS: Record<string, string> = {
  new: 'bg-stone-400',
  engaged: 'bg-amber-400',
  qualified: 'bg-sky-400',
  converted: 'bg-emerald-400',
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
      {/* Row 1: status dot + name + channel + time */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            STATUS_DOT_COLORS[contact.status] ?? 'bg-stone-400',
          )}
        />
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
      <div className="pl-4">
        <span className="truncate text-xs text-muted-foreground">
          {truncate(contact.last_message_preview, 45) || 'No messages yet'}
        </span>
      </div>

      {/* Row 3: tags + deal value (always rendered for consistent height) */}
      <div className="flex min-h-4 items-center gap-1.5 pl-4">
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
