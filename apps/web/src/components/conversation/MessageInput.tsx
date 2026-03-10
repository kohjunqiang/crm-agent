'use client';

import { useState, useCallback } from 'react';
import { SendHorizonal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');

  const send = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }, [value, onSend]);

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        disabled={disabled}
        placeholder={
          disabled
            ? 'AI Agent is handling this conversation. Toggle off to reply.'
            : 'Type a message...'
        }
      />
      <Button
        size="icon"
        onClick={send}
        disabled={disabled || value.trim().length === 0}
      >
        <SendHorizonal />
      </Button>
    </div>
  );
}
