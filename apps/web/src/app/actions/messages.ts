'use server';

import { createClient } from '@/lib/supabase/server';
import type { Message } from '@agent-crm/shared';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function authFetch(path: string, options?: RequestInit) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('No session');
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
  if (data.warning) {
    return data as { message: Message; warning: string };
  }
  return { message: data as Message };
}

export async function getMessages(contactId: string): Promise<Message[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('contact_id', contactId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Message[];
}
