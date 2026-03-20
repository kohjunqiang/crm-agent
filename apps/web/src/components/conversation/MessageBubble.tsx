'use client';

import type { Message } from '@agent-crm/shared';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format';

interface MessageBubbleProps {
  message: Message;
}

const senderLabel: Record<Message['sender'], string> = {
  lead: 'Lead',
  agent: 'AI Agent',
  human: 'You',
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isLead = message.sender === 'lead';

  return (
    <div
      className={cn('flex flex-col gap-1', isLead ? 'items-start' : 'items-end')}
    >
      <span className="text-xs text-muted-foreground">
        {senderLabel[message.sender]}
      </span>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words',
          message.sender === 'lead' && 'bg-muted text-foreground',
          message.sender === 'agent' && 'bg-blue-500 text-white',
          message.sender === 'human' && 'bg-green-500 text-white',
        )}
      >
        {message.content}
      </div>
      <span className="text-[11px] text-muted-foreground">
        {formatRelativeTime(message.created_at)}
      </span>
    </div>
  );
}
