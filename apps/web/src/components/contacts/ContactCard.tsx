'use client';

import type { Contact } from '@agent-crm/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ContactCardProps {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  engaged: 'bg-blue-100 text-blue-700',
  qualified: 'bg-amber-100 text-amber-700',
  converted: 'bg-green-100 text-green-700',
};

function getDisplayName(contact: Contact): string {
  return contact.name || contact.phone || contact.telegram_chat_id || 'Unknown';
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

function truncate(text: string | null, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export function ContactCard({ contact, isSelected, onClick }: ContactCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-1 rounded-lg border px-3 py-3 text-left transition-colors',
        isSelected
          ? 'border-primary/20 bg-accent'
          : 'border-transparent hover:bg-accent/50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">
          {getDisplayName(contact)}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {contact.last_message_at && (
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(contact.last_message_at)}
            </span>
          )}
          <Badge
            variant="outline"
            className={cn(
              'px-1.5 py-0 text-[10px] font-semibold',
              contact.channel === 'whatsapp'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-blue-200 bg-blue-50 text-blue-700',
            )}
          >
            {contact.channel === 'whatsapp' ? 'WA' : 'TG'}
          </Badge>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">
          {truncate(contact.last_message_preview, 50) || 'No messages yet'}
        </span>
        <Badge
          variant="secondary"
          className={cn(
            'px-1.5 py-0 text-[10px]',
            statusColors[contact.status],
          )}
        >
          {contact.status}
        </Badge>
      </div>
    </button>
  );
}
