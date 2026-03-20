'use server';

import { createClient } from '@/lib/supabase/server';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@agent-crm/shared';
import { logActivity } from './activities';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

export async function getTasks(filter?: {
  status?: 'pending' | 'done';
  contactId?: string;
  dealId?: string;
}): Promise<Task[]> {
  const { supabase, userId } = await getUserId();
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (filter?.status) query = query.eq('status', filter.status);
  if (filter?.contactId) query = query.eq('contact_id', filter.contactId);
  if (filter?.dealId) query = query.eq('deal_id', filter.dealId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Task[];
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...input, user_id: userId, created_by: 'human' })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const task = data as Task;
  await logActivity(supabase, {
    userId,
    contactId: task.contact_id,
    entityType: 'task',
    entityId: task.id,
    eventType: 'created',
    actor: 'human',
    metadata: { title: task.title },
  });
  return task;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('tasks')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  const task = data as Task;
  const eventType = input.status === 'done' ? 'completed' : 'updated';
  await logActivity(supabase, {
    userId,
    contactId: task.contact_id,
    entityType: 'task',
    entityId: task.id,
    eventType,
    actor: 'human',
    metadata: { title: task.title },
  });
  return task;
}

export async function deleteTask(id: string): Promise<void> {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
