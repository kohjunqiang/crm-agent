'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Contact, Deal } from '@agent-crm/shared';
import { getContacts } from '@/app/actions/contacts';
import { getDeals } from '@/app/actions/deals';
import { createClient } from '@/lib/supabase/client';
import { ContactList } from '@/components/contacts/ContactList';
import { Separator } from '@/components/ui/separator';
import { ConversationPanel } from '@/components/conversation/ConversationPanel';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function ConversationsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [contactsData, dealsData] = await Promise.all([
        getContacts(),
        getDeals(),
      ]);
      setContacts(contactsData);
      setDeals(dealsData);
    } catch {
      setContacts([]);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build deal value map: contact_id → total active deal value
  const dealValues = useMemo(() => {
    const map = new Map<string, number>();
    for (const deal of deals) {
      if (deal.stage === 'completed' || deal.stage === 'lost') continue;
      if (deal.amount != null) {
        map.set(deal.contact_id, (map.get(deal.contact_id) ?? 0) + deal.amount);
      }
    }
    return map;
  }, [deals]);

  const { onNewMessage } = useRealtimeMessages(userId);

  useEffect(() => {
    onNewMessage((message) => {
      setContacts((prev) => {
        const idx = prev.findIndex((c) => c.id === message.contact_id);
        if (idx === -1) {
          fetchData();
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
  }, [onNewMessage, fetchData]);

  return (
    <div className="-m-4 flex flex-col md:-m-6">
      <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden border-r md:h-screen">
        {/* Contact list — hidden on mobile when a contact is selected */}
        <div
          className={cn(
            'flex w-full flex-col md:w-80 md:shrink-0',
            selectedId && 'hidden md:flex',
          )}
        >
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
                dealValues={dealValues}
              />
            )}
          </div>
        </div>
        <Separator orientation="vertical" className="hidden md:block" />
        {/* Conversation panel — hidden on mobile when no contact selected */}
        <div
          className={cn(
            'flex flex-1 flex-col',
            !selectedId && 'hidden md:flex',
          )}
        >
          {selectedId ? (
            <>
              <button
                onClick={() => setSelectedId(null)}
                className="flex h-11 items-center gap-2 px-4 text-sm text-muted-foreground hover:text-foreground md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <ConversationPanel
                key={selectedId}
                contactId={selectedId}
                onDeleted={() => {
                  setContacts((prev) =>
                    prev.filter((c) => c.id !== selectedId),
                  );
                  setSelectedId(null);
                }}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select a contact to view the conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
