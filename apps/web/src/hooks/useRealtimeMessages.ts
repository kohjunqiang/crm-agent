'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Message } from '@agent-crm/shared';
import { createClient } from '@/lib/supabase/client';

type MessageCallback = (message: Message) => void;

export function useRealtimeMessages(userId: string | null) {
  const callbackRef = useRef<MessageCallback | null>(null);

  const onNewMessage = useCallback((cb: MessageCallback) => {
    callbackRef.current = cb;
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const message = payload.new as Message;
          callbackRef.current?.(message);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { onNewMessage };
}
