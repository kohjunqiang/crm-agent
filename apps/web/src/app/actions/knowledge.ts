'use server';

import { createClient } from '@/lib/supabase/server';
import type { KnowledgeBaseEntry } from '@agent-crm/shared';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

export async function getKnowledgeEntries(): Promise<KnowledgeBaseEntry[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as KnowledgeBaseEntry[];
}

export async function createKnowledgeEntry(input: {
  title: string;
  content: string;
}): Promise<KnowledgeBaseEntry> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as KnowledgeBaseEntry;
}

export async function updateKnowledgeEntry(
  id: string,
  input: { title?: string; content?: string },
): Promise<KnowledgeBaseEntry> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('knowledge_base')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as KnowledgeBaseEntry;
}

export async function deleteKnowledgeEntry(id: string): Promise<void> {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from('knowledge_base')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
