'use client';

import type { Message } from '@agent-crm/shared';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
}

const senderLabel: Record<Message['sender'], string> = {
  lead: 'Lead',
  agent: 'AI Agent',
  human: 'You',
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

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
