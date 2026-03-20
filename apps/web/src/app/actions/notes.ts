'use server';

import { createClient } from '@/lib/supabase/server';
import type { Note, CreateNoteInput } from '@agent-crm/shared';
import { logActivity } from './activities';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

export async function getNotes(contactId: string): Promise<Note[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('contact_id', contactId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Note[];
}

export async function createNote(contactId: string, input: CreateNoteInput): Promise<Note> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('notes')
    .insert({ ...input, contact_id: contactId, user_id: userId, author: 'human' })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const note = data as Note;
  await logActivity(supabase, {
    userId,
    contactId,
    entityType: 'note',
    entityId: note.id,
    eventType: 'created',
    actor: 'human',
  });
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
