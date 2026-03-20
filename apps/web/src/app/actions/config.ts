'use server';

import { createClient } from '@/lib/supabase/server';
import type { AgentConfig } from '@agent-crm/shared';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function setTelegramWebhook(): Promise<{
  success: boolean;
  webhook_url: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('No session');
  const res = await fetch(`${API_URL}/api/config/telegram/set-webhook`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getAgentConfig(): Promise<AgentConfig | null> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('agent_config')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data as AgentConfig;
}

export async function updateAgentConfig(
  input: Partial<AgentConfig>,
): Promise<AgentConfig> {
  const { supabase, userId } = await getUserId();

  // Upsert: create if not exists, update if exists
  const { data, error } = await supabase
    .from('agent_config')
    .upsert({ ...input, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as AgentConfig;
}
