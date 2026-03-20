'use client';

import type { Contact, ContactStatus } from '@agent-crm/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface ConversationHeaderProps {
  contact: Contact;
  onStatusChange: (status: ContactStatus) => void;
  onAgentToggle: (enabled: boolean) => void;
  onDelete: () => void;
}

const statuses: { value: ContactStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
];

const STATUS_DOT_COLORS: Record<string, string> = {
  new: 'bg-stone-400',
  engaged: 'bg-amber-400',
  qualified: 'bg-sky-400',
  converted: 'bg-emerald-400',
};

function getDisplayName(contact: Contact): string {
  return contact.name || contact.phone || contact.telegram_chat_id || 'Unknown';
}

function getInitials(contact: Contact): string {
  const name = getDisplayName(contact);
  return name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

export function ConversationHeader({
  contact,
  onStatusChange,
  onAgentToggle,
  onDelete,
}: ConversationHeaderProps) {
  const tags = contact.tags ?? [];

  return (
    <div className="flex items-center gap-2 px-3 py-2 md:gap-3 md:px-4 md:py-2.5">
      {/* Avatar */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white md:h-9 md:w-9',
          STATUS_DOT_COLORS[contact.status] ?? 'bg-stone-400',
        )}
      >
        {getInitials(contact)}
      </div>

      {/* Name + subtitle */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">
            {getDisplayName(contact)}
          </span>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 px-1.5 py-0 text-[10px] font-semibold',
              contact.channel === 'whatsapp'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-blue-200 bg-blue-50 text-blue-700',
            )}
          >
            {contact.channel === 'whatsapp' ? 'WA' : 'TG'}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {contact.phone && (
            <span className="text-[11px] text-muted-foreground">
              {contact.phone}
            </span>
          )}
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-1.5 py-0 text-[9px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Status dropdown */}
      <Select
        value={contact.status}
        onValueChange={(v) => onStatusChange(v as ContactStatus)}
      >
        <SelectTrigger className="h-7 w-[90px] text-xs md:w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-xs">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Agent toggle */}
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            'hidden text-[11px] md:inline',
            contact.agent_enabled
              ? 'text-emerald-600'
              : 'text-muted-foreground',
          )}
        >
          {contact.agent_enabled ? 'Agent On' : 'Agent Off'}
        </span>
        <Switch
          checked={contact.agent_enabled}
          onCheckedChange={onAgentToggle}
        />
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
