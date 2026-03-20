'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@agent-crm/shared';
import { MessageBubble } from './MessageBubble';
import { MessageSquare } from 'lucide-react';

interface MessageThreadProps {
  messages: Message[];
}

export function MessageThread({ messages }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No messages yet</p>
        <p className="text-xs text-muted-foreground/60">
          Messages will appear here when the conversation starts
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
