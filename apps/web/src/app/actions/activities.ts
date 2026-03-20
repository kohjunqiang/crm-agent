'use server';

import { createClient } from '@/lib/supabase/server';
import type { Activity, ActivityActor } from '@agent-crm/shared';
import type { SupabaseClient } from '@supabase/supabase-js';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

export async function getActivities(contactId?: string): Promise<Activity[]> {
  const { supabase, userId } = await getUserId();
  let query = supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (contactId) {
    query = query.eq('contact_id', contactId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Activity[];
}

/** Helper used by other Server Actions to log activities. Not exported as a Server Action itself. */
export async function logActivity(
  supabase: SupabaseClient,
  params: {
    userId: string;
    contactId?: string | null;
    entityType: string;
    entityId?: string;
    eventType: string;
    actor: ActivityActor;
    metadata?: Record<string, any>;
  },
): Promise<void> {
  await supabase.from('activities').insert({
    user_id: params.userId,
    contact_id: params.contactId ?? null,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    event_type: params.eventType,
    actor: params.actor,
    metadata: params.metadata ?? {},
  });
}
