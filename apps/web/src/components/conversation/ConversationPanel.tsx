'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Contact, ContactStatus, Message } from '@agent-crm/shared';
import { toast } from 'sonner';
import { getContact, updateContact, deleteContact } from '@/app/actions/contacts';
import { getMessages } from '@/app/actions/messages';
import { sendMessage } from '@/app/actions/messages';
import { createClient } from '@/lib/supabase/client';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversationHeader } from './ConversationHeader';
import { MessageThread } from './MessageThread';
import { MessageInput } from './MessageInput';
import { ContactDetails } from '@/components/contacts/ContactDetails';
import { ContactDeals } from '@/components/contacts/ContactDeals';
import { ContactNotes } from '@/components/contacts/ContactNotes';
import { ContactTasks } from '@/components/contacts/ContactTasks';

interface ConversationPanelProps {
  contactId: string;
  onDeleted?: () => void;
}

export function ConversationPanel({ contactId, onDeleted }: ConversationPanelProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [contact, messages] = await Promise.all([
        getContact(contactId),
        getMessages(contactId),
      ]);
      setContact(contact);
      setMessages(messages);
    } catch {
      setContact(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to new messages for this specific contact
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`conversation:${contactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Skip outbound human messages — handled by optimistic + API response flow
            if (newMessage.direction === 'outbound' && newMessage.sender === 'human') {
              return prev;
            }
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId]);

  const handleStatusChange = useCallback(
    async (status: ContactStatus) => {
      setContact((prev) => (prev ? { ...prev, status } : prev));
      try {
        await updateContact(contactId, { status });
      } catch {
        // Revert on failure
        fetchData();
      }
    },
    [contactId, fetchData],
  );

  const handleAgentToggle = useCallback(
    async (enabled: boolean) => {
      setContact((prev) =>
        prev ? { ...prev, agent_enabled: enabled } : prev,
      );
      try {
        await updateContact(contactId, { agent_enabled: enabled });
      } catch {
        // Revert on failure
        fetchData();
      }
    },
    [contactId, fetchData],
  );

  const handleDelete = useCallback(async () => {
    if (!confirm('Delete this contact and all messages?')) return;
    try {
      await deleteContact(contactId);
      onDeleted?.();
    } catch {
      toast.error('Failed to delete contact.');
    }
  }, [contactId, onDeleted]);

  const handleSend = useCallback(
    async (content: string) => {
      // Optimistic message
      const optimistic: Message = {
        id: crypto.randomUUID(),
        contact_id: contactId,
        user_id: '',
        direction: 'outbound',
        sender: 'human',
        channel: contact?.channel ?? 'telegram',
        content,
        external_id: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const { message: saved, warning } = await sendMessage(contactId, content);
        if (warning) {
          toast.warning(warning);
        }
        // Replace optimistic with real message, dedup against realtime
        setMessages((prev) => {
          const without = prev.filter(
            (m) => m.id !== optimistic.id && m.id !== saved.id,
          );
          return [...without, saved];
        });
      } catch {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        toast.error('Failed to send message. Please try again.');
      }
    },
    [contactId, contact?.channel],
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading conversation…</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Contact not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConversationHeader
        contact={contact}
        onStatusChange={handleStatusChange}
        onAgentToggle={handleAgentToggle}
        onDelete={handleDelete}
      />
      <Separator />

      <Tabs defaultValue="chat" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2 w-[calc(100%-1.5rem)] md:w-fit">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden mt-0">
          <MessageThread messages={messages} />
          <Separator />
          <MessageInput
            onSend={handleSend}
            disabled={contact.agent_enabled}
          />
        </TabsContent>

        <TabsContent value="details" className="flex-1 overflow-y-auto p-4 mt-0">
          <ContactDetails contact={contact} onUpdated={() => { fetchData(); }} />
        </TabsContent>

        <TabsContent value="deals" className="flex-1 overflow-y-auto p-4 mt-0">
          <ContactDeals contactId={contactId} />
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 overflow-y-auto mt-0">
          <ContactTasks contactId={contactId} />
        </TabsContent>

        <TabsContent value="notes" className="flex-1 overflow-y-auto p-4 mt-0">
          <ContactNotes contactId={contactId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
