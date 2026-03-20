'use server';

import { createClient } from '@/lib/supabase/server';
import type { Message } from '@agent-crm/shared';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
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
