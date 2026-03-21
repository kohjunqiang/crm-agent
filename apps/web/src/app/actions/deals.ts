'use server';

import { createClient } from '@/lib/supabase/server';
import type { Deal, CreateDealInput, UpdateDealInput } from '@agent-crm/shared';
import { logActivity } from './activities';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

export async function getDeals(contactId?: string): Promise<Deal[]> {
  const { supabase, userId } = await getUserId();
  let query = supabase
    .from('deals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (contactId) {
    query = query.eq('contact_id', contactId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Deal[];
}

export async function getDealsByStage(): Promise<Deal[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('user_id', userId)
    .not('stage', 'in', '("completed","lost")')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Deal[];
}

export async function createDeal(contactId: string, input: CreateDealInput): Promise<Deal> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('deals')
    .insert({ ...input, contact_id: contactId, user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const deal = data as Deal;
  await logActivity(supabase, {
    userId,
    contactId,
    entityType: 'deal',
    entityId: deal.id,
    eventType: 'created',
    actor: 'human',
    metadata: { title: deal.title, stage: deal.stage },
  });
  return deal;
}

export async function updateDeal(id: string, input: UpdateDealInput): Promise<Deal> {
  const { supabase, userId } = await getUserId();

  // Get current deal for activity logging
  const { data: current } = await supabase
    .from('deals')
    .select('stage, contact_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  const { data, error } = await supabase
    .from('deals')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Auto-create order when deal moves to "ordered"
  if (input.stage === 'ordered' && current?.stage !== 'ordered') {
    try {
      const { createOrderFromDeal } = await import('./orders');
      await createOrderFromDeal(id);
    } catch (err) {
      console.error('Failed to auto-create order:', err);
    }
  }

  const deal = data as Deal;
  const eventType = input.stage && input.stage !== current?.stage ? 'stage_changed' : 'updated';
  await logActivity(supabase, {
    userId,
    contactId: current?.contact_id,
    entityType: 'deal',
    entityId: deal.id,
    eventType,
    actor: 'human',
    metadata: input.stage !== current?.stage
      ? { from: current?.stage, to: input.stage }
      : {},
  });
  return deal;
}

export async function deleteDeal(id: string): Promise<void> {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
