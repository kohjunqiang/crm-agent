'use client';

import type { Contact, ContactStatus } from '@agent-crm/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

function getDisplayName(contact: Contact): string {
  return contact.name || contact.phone || contact.telegram_chat_id || 'Unknown';
}

export function ConversationHeader({
  contact,
  onStatusChange,
  onAgentToggle,
  onDelete,
}: ConversationHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      {/* Left side: name + channel badge */}
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="truncate text-sm font-semibold">
          {getDisplayName(contact)}
        </h2>
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

      {/* Right side: status dropdown + agent toggle */}
      <div className="flex shrink-0 items-center gap-4">
        <Select
          value={contact.status}
          onValueChange={(v) => onStatusChange(v as ContactStatus)}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
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

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-0.5">
            <Label htmlFor="agent-toggle" className="text-xs font-medium">
              AI Agent
            </Label>
            <span
              className={cn(
                'text-[11px]',
                contact.agent_enabled
                  ? 'text-green-600'
                  : 'text-muted-foreground',
              )}
            >
              {contact.agent_enabled ? 'Agent is replying' : 'Agent paused'}
            </span>
          </div>
          <Switch
            id="agent-toggle"
            checked={contact.agent_enabled}
            onCheckedChange={onAgentToggle}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
