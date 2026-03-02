import { createClient } from '@/lib/supabase/client';
import type {
  Contact,
  Message,
  KnowledgeBaseEntry,
  AgentConfig,
} from '@agent-crm/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function authFetch(path: string, options?: RequestInit) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res;
}

// Contacts
export async function getContacts(): Promise<{ contacts: Contact[] }> {
  const res = await authFetch('/api/contacts');
  return res.json();
}

export async function getContact(
  id: string,
): Promise<{ contact: Contact; messages: Message[] }> {
  const res = await authFetch(`/api/contacts/${id}`);
  return res.json();
}

export async function updateContact(
  id: string,
  data: { status?: string; agent_enabled?: boolean; name?: string },
): Promise<Contact> {
  const res = await authFetch(`/api/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function sendMessage(
  contactId: string,
  content: string,
): Promise<Message> {
  const res = await authFetch(`/api/contacts/${contactId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  return res.json();
}

// Knowledge Base
export async function getKnowledgeEntries(): Promise<{
  entries: KnowledgeBaseEntry[];
}> {
  const res = await authFetch('/api/knowledge');
  return res.json();
}

export async function createKnowledgeEntry(data: {
  title: string;
  content: string;
}): Promise<KnowledgeBaseEntry> {
  const res = await authFetch('/api/knowledge', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateKnowledgeEntry(
  id: string,
  data: { title?: string; content?: string },
): Promise<KnowledgeBaseEntry> {
  const res = await authFetch(`/api/knowledge/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteKnowledgeEntry(id: string): Promise<void> {
  await authFetch(`/api/knowledge/${id}`, { method: 'DELETE' });
}

// Agent Config
export async function getAgentConfig(): Promise<{ config: AgentConfig }> {
  const res = await authFetch('/api/config');
  return res.json();
}

export async function updateAgentConfig(
  data: Partial<AgentConfig>,
): Promise<AgentConfig> {
  const res = await authFetch('/api/config', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.json();
}

// Telegram
export async function setTelegramWebhook(): Promise<{
  success: boolean;
  webhook_url: string;
}> {
  const res = await authFetch('/api/config/telegram/set-webhook', {
    method: 'POST',
  });
  return res.json();
}
