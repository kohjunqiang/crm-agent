'use server';

import { createClient } from '@/lib/supabase/server';
import type { Payment, CreatePaymentInput } from '@agent-crm/shared';
import { logActivity } from './activities';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

export async function getPayments(dealId: string): Promise<Payment[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('deal_id', dealId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Payment[];
}

export async function getAllPayments(): Promise<Payment[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Payment[];
}

export async function createPayment(dealId: string, input: CreatePaymentInput): Promise<Payment> {
  const { supabase, userId } = await getUserId();

  // Get the deal's contact_id for activity logging
  const { data: deal } = await supabase
    .from('deals')
    .select('contact_id')
    .eq('id', dealId)
    .eq('user_id', userId)
    .single();

  const { data, error } = await supabase
    .from('payments')
    .insert({
      ...input,
      deal_id: dealId,
      user_id: userId,
      paid_at: input.paid_at ?? new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const payment = data as Payment;
  await logActivity(supabase, {
    userId,
    contactId: deal?.contact_id,
    entityType: 'payment',
    entityId: payment.id,
    eventType: 'payment_recorded',
    actor: 'human',
    metadata: { amount: payment.amount, label: payment.label, deal_id: dealId },
  });
  return payment;
}

export async function issueReceipt(id: string): Promise<Payment> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('payments')
    .update({ receipt_issued_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  const payment = data as Payment;
  // Get deal for contact_id
  const { data: deal } = await supabase
    .from('deals')
    .select('contact_id')
    .eq('id', payment.deal_id)
    .single();

  await logActivity(supabase, {
    userId,
    contactId: deal?.contact_id,
    entityType: 'payment',
    entityId: payment.id,
    eventType: 'receipt_issued',
    actor: 'human',
    metadata: { amount: payment.amount, label: payment.label },
  });
  return payment;
}
