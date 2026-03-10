'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Contact } from '@agent-crm/shared';
import { getContacts } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { ContactList } from '@/components/contacts/ContactList';
import { Separator } from '@/components/ui/separator';
import { ConversationPanel } from '@/components/conversation/ConversationPanel';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user.id ?? null);
    });
  }, []);

  const fetchContacts = useCallback(() => {
    getContacts()
      .then((data) => setContacts(data.contacts))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const { onNewMessage } = useRealtimeMessages(userId);

  useEffect(() => {
    onNewMessage((message) => {
      setContacts((prev) => {
        const idx = prev.findIndex((c) => c.id === message.contact_id);
        if (idx === -1) {
          // Contact not in list — refetch everything
          fetchContacts();
          return prev;
        }
        const updated = prev.map((c) =>
          c.id === message.contact_id
            ? {
                ...c,
                last_message_preview: message.content,
                last_message_at: message.created_at,
              }
            : c,
        );
        return updated.sort((a, b) => {
          const aTime = a.last_message_at
            ? new Date(a.last_message_at).getTime()
            : 0;
          const bTime = b.last_message_at
            ? new Date(b.last_message_at).getTime()
            : 0;
          return bTime - aTime;
        });
      });
    });
  }, [onNewMessage, fetchContacts]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.6)*2)] overflow-hidden rounded-lg border">
      <div className="flex w-80 shrink-0 flex-col">
        <div className="flex items-center px-4 py-3">
          <h1 className="text-lg font-semibold">Contacts</h1>
        </div>
        <Separator />
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading contacts…
            </p>
          ) : (
            <ContactList
              contacts={contacts}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </div>
      <Separator orientation="vertical" />
      {selectedId ? (
        <ConversationPanel
          key={selectedId}
          contactId={selectedId}
          onDeleted={() => {
            setContacts((prev) => prev.filter((c) => c.id !== selectedId));
            setSelectedId(null);
          }}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Select a contact to view the conversation.
          </p>
        </div>
      )}
    </div>
  );
}
