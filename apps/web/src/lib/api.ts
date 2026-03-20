import { createClient } from '@/lib/supabase/client';
import type { Message } from '@agent-crm/shared';

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

export async function sendMessage(
  contactId: string,
  content: string,
): Promise<{ message: Message; warning?: string }> {
  const res = await authFetch(`/api/contacts/${contactId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  // Controller returns Message directly on success, or { message, warning } on issues
  if (data.warning) {
    return data as { message: Message; warning: string };
  }
  return { message: data as Message };
}

export async function setTelegramWebhook(): Promise<{
  success: boolean;
  webhook_url: string;
}> {
  const res = await authFetch('/api/config/telegram/set-webhook', {
    method: 'POST',
  });
  return res.json();
}
