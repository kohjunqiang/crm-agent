'use server';

import { createClient } from '@/lib/supabase/server';
import type { Contact, UpdateContactInput } from '@agent-crm/shared';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

export async function getContacts(): Promise<Contact[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data as Contact[];
}

export async function getContact(id: string): Promise<Contact | null> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data as Contact;
}

export async function updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('contacts')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Contact;
}

export async function deleteContact(id: string): Promise<void> {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
