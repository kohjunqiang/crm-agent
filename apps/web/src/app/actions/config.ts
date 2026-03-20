'use server';

import { createClient } from '@/lib/supabase/server';
import type { AgentConfig } from '@agent-crm/shared';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
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
