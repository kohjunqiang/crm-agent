'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  Order,
  OrderItem,
  OrderStageConfig,
  OrderStageHistory,
  Payment,
  CreateOrderStageConfigInput,
  UpdateOrderStageConfigInput,
  UpdateOrderInput,
  DealProduct,
} from '@agent-crm/shared';
import {
  CreateOrderStageConfigSchema,
  UpdateOrderStageConfigSchema,
  UpdateOrderSchema,
} from '@agent-crm/shared';
import { logActivity } from './activities';

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

const DEFAULT_STAGES = [
  { name: 'Ordered', sort_order: 0, color: '#f97316' },
  { name: 'In Production', sort_order: 1, color: '#3b82f6' },
  { name: 'Ready for Delivery', sort_order: 2, color: '#22c55e' },
  { name: 'Delivered', sort_order: 3, color: '#a855f7' },
];

async function ensureDefaultStages(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
): Promise<void> {
  const { count, error: countError } = await supabase
    .from('order_stages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) throw new Error(countError.message);

  if (count === 0) {
    const { error: insertError } = await supabase
      .from('order_stages')
      .insert(DEFAULT_STAGES.map((s) => ({ ...s, user_id: userId })));
    if (insertError) throw new Error(insertError.message);
  }
}

// --- Stage config CRUD ---

export async function getOrderStageConfigs(): Promise<OrderStageConfig[]> {
  const { supabase, userId } = await getUserId();
  await ensureDefaultStages(supabase, userId);

  const { data, error } = await supabase
    .from('order_stages')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data as OrderStageConfig[];
}

export async function createOrderStageConfig(
  input: CreateOrderStageConfigInput,
): Promise<OrderStageConfig> {
  const validated = CreateOrderStageConfigSchema.parse(input);
  const { supabase, userId } = await getUserId();

  // Get max sort_order if not provided
  let sortOrder = validated.sort_order;
  if (sortOrder === undefined) {
    const { data: existing } = await supabase
      .from('order_stages')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1);
    sortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;
  }

  const { data, error } = await supabase
    .from('order_stages')
    .insert({
      user_id: userId,
      name: validated.name,
      color: validated.color ?? '#6b7280',
      sort_order: sortOrder,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId,
    entityType: 'order_stage',
    entityId: data.id,
    eventType: 'created',
    actor: 'human',
    metadata: { name: validated.name },
  });
  return data as OrderStageConfig;
}

export async function updateOrderStageConfig(
  id: string,
  input: UpdateOrderStageConfigInput,
): Promise<OrderStageConfig> {
  const validated = UpdateOrderStageConfigSchema.parse(input);
  const { supabase, userId } = await getUserId();

  // Capture old name before updating config (needed for batch-update)
  let oldName: string | null = null;
  if (validated.name) {
    const { data: current } = await supabase
      .from('order_stages')
      .select('name')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (current && current.name !== validated.name) {
      oldName = current.name;
    }
  }

  // Update config first — if this fails, orders remain consistent
  const { data, error } = await supabase
    .from('order_stages')
    .update(validated)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Then batch-update orders with the old stage name
  if (oldName && validated.name) {
    const { error: batchError } = await supabase
      .from('orders')
      .update({ stage: validated.name })
      .eq('user_id', userId)
      .eq('stage', oldName);
    if (batchError) throw new Error(batchError.message);
  }

  await logActivity(supabase, {
    userId,
    entityType: 'order_stage',
    entityId: id,
    eventType: 'updated',
    actor: 'human',
    metadata: validated,
  });
  return data as OrderStageConfig;
}

export async function deleteOrderStageConfig(id: string): Promise<void> {
  const { supabase, userId } = await getUserId();

  // Get stage name to check if orders use it
  const { data: stage } = await supabase
    .from('order_stages')
    .select('name')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (!stage) throw new Error('Stage not found');

  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('stage', stage.name);

  if (count && count > 0) {
    throw new Error(
      `Cannot delete stage: ${count} order${count > 1 ? 's are' : ' is'} currently in "${stage.name}"`,
    );
  }

  const { error } = await supabase
    .from('order_stages')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId,
    entityType: 'order_stage',
    entityId: id,
    eventType: 'deleted',
    actor: 'human',
    metadata: { name: stage.name },
  });
}

// --- Orders CRUD ---

export async function getOrders(): Promise<
  (Order & { contact_name: string | null; item_count: number })[]
> {
  const { supabase, userId } = await getUserId();
  await ensureDefaultStages(supabase, userId);

  const { data, error } = await supabase
    .from('orders')
    .select('*, contacts(name), order_items(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  type RawRow = Order & {
    contacts: { name: string | null } | null;
    order_items: { count: number }[];
  };

  return (data as RawRow[]).map((row) => ({
    ...row,
    contact_name: row.contacts?.name ?? null,
    item_count: row.order_items?.[0]?.count ?? 0,
    contacts: undefined,
    order_items: undefined,
  })) as (Order & { contact_name: string | null; item_count: number })[];
}

export async function getOrder(id: string): Promise<{
  order: Order & { contact_name: string | null };
  items: OrderItem[];
  history: OrderStageHistory[];
  payments: Payment[];
}> {
  const { supabase, userId } = await getUserId();

  // Fetch order with contact name
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*, contacts(name)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (orderError) throw new Error(orderError.message);

  const raw = orderData as Order & { contacts: { name: string | null } | null };
  const order = {
    ...raw,
    contact_name: raw.contacts?.name ?? null,
    contacts: undefined,
  } as Order & { contact_name: string | null };

  // Fetch items, history, and payments in parallel
  const [itemsResult, historyResult, paymentsResult] = await Promise.all([
    supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('order_stage_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('payments')
      .select('*')
      .eq('deal_id', order.deal_id)
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ]);

  if (itemsResult.error) throw new Error(itemsResult.error.message);
  if (historyResult.error) throw new Error(historyResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);

  return {
    order,
    items: itemsResult.data as OrderItem[],
    history: historyResult.data as OrderStageHistory[],
    payments: paymentsResult.data as Payment[],
  };
}

export async function createOrderFromDeal(dealId: string): Promise<Order | null> {
  const { supabase, userId } = await getUserId();

  // Check if order already exists for this deal
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('deal_id', dealId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await logActivity(supabase, {
      userId,
      entityType: 'order',
      eventType: 'skipped_duplicate',
      actor: 'system',
      metadata: { deal_id: dealId },
    });
    return null;
  }

  // Fetch deal
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .eq('user_id', userId)
    .single();
  if (dealError) throw new Error(dealError.message);

  // Ensure stages exist and get the first stage
  await ensureDefaultStages(supabase, userId);
  const { data: stages } = await supabase
    .from('order_stages')
    .select('name')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .limit(1);
  const firstStage = stages?.[0]?.name ?? 'Ordered';

  // Generate order number
  const { data: nextNum, error: seqError } = await supabase.rpc('next_doc_number', {
    p_user_id: userId,
    p_type: 'order',
  });
  if (seqError) throw new Error(`Failed to generate order number: ${seqError.message}`);
  const orderNumber = `ORD-${String(nextNum).padStart(3, '0')}`;

  // Compute total from deal products
  const products = (deal.products ?? []) as DealProduct[];
  const totalAmount = products.reduce(
    (sum: number, p: DealProduct) => sum + (p.qty ?? 1) * (p.price ?? 0),
    0,
  );

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      deal_id: dealId,
      contact_id: deal.contact_id,
      user_id: userId,
      order_number: orderNumber,
      title: deal.title,
      stage: firstStage,
      total_amount: totalAmount,
    })
    .select()
    .single();
  if (orderError) throw new Error(orderError.message);

  // Map deal products to order items
  if (products.length > 0) {
    const orderItems = products.map((p: DealProduct, i: number) => ({
      order_id: order.id,
      name: p.name,
      qty: p.qty ?? 1,
      unit_price: p.price ?? 0,
      product_id: p.product_id ?? null,
      product_variant_id: p.variant_id ?? null,
      width_cm: p.width_cm ?? null,
      drop_cm: p.drop_cm ?? null,
      room_name: p.room_name ?? null,
      window_position: p.window_position ?? null,
      fixing_type: p.fixing_type ?? null,
      stack_direction: p.stack_direction ?? null,
      lining_type: p.lining_type ?? null,
      motorization: p.motorization ?? null,
      notes: p.notes ?? null,
      sort_order: i,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    if (itemsError) throw new Error(itemsError.message);
  }

  // Insert initial stage history
  const { error: historyError } = await supabase.from('order_stage_history').insert({
    order_id: order.id,
    from_stage: null,
    to_stage: firstStage,
    changed_by: null,
    notes: 'Order created from deal',
  });
  if (historyError) throw new Error(historyError.message);

  // Log activity
  await logActivity(supabase, {
    userId,
    contactId: deal.contact_id,
    entityType: 'order',
    entityId: order.id,
    eventType: 'created',
    actor: 'system',
    metadata: {
      order_number: orderNumber,
      deal_id: dealId,
      title: deal.title,
      total_amount: totalAmount,
    },
  });

  return order as Order;
}

export async function advanceOrderStage(
  orderId: string,
  note?: string,
): Promise<Order> {
  const { supabase, userId } = await getUserId();

  // Fetch current order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();
  if (orderError) throw new Error(orderError.message);

  // Fetch all stages ordered by sort_order
  const { data: stages } = await supabase
    .from('order_stages')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (!stages || stages.length === 0) throw new Error('No stages configured');

  const currentIndex = stages.findIndex((s) => s.name === order.stage);
  if (currentIndex === -1) {
    throw new Error(`Order stage "${order.stage}" not found in configured stages`);
  }
  if (currentIndex === stages.length - 1) {
    throw new Error('Order is already at the final stage');
  }

  const nextStage = stages[currentIndex + 1];

  // Update order stage
  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({ stage: nextStage.name })
    .eq('id', orderId)
    .eq('user_id', userId)
    .select()
    .single();
  if (updateError) throw new Error(updateError.message);

  // Record stage history
  const { error: histError } = await supabase.from('order_stage_history').insert({
    order_id: orderId,
    from_stage: order.stage,
    to_stage: nextStage.name,
    changed_by: userId,
    notes: note ?? null,
  });
  if (histError) throw new Error(histError.message);

  // Log activity
  await logActivity(supabase, {
    userId,
    contactId: order.contact_id,
    entityType: 'order',
    entityId: orderId,
    eventType: 'stage_changed',
    actor: 'human',
    metadata: { from: order.stage, to: nextStage.name },
  });

  // If final stage reached, auto-advance linked deal to "fulfilled"
  const isFinalStage = currentIndex + 1 === stages.length - 1;
  if (isFinalStage) {
    const { data: deal } = await supabase
      .from('deals')
      .select('stage')
      .eq('id', order.deal_id)
      .eq('user_id', userId)
      .single();

    if (deal && deal.stage === 'ordered') {
      await supabase
        .from('deals')
        .update({ stage: 'fulfilled' })
        .eq('id', order.deal_id)
        .eq('user_id', userId);

      await logActivity(supabase, {
        userId,
        contactId: order.contact_id,
        entityType: 'deal',
        entityId: order.deal_id,
        eventType: 'stage_changed',
        actor: 'system',
        metadata: { from: 'ordered', to: 'fulfilled', triggered_by: 'order_delivered' },
      });
    }
  }

  return updated as Order;
}

export async function updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
  const validated = UpdateOrderSchema.parse(input);
  const { supabase, userId } = await getUserId();

  const { data, error } = await supabase
    .from('orders')
    .update(validated)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId,
    entityType: 'order',
    entityId: id,
    eventType: 'updated',
    actor: 'human',
    metadata: validated,
  });
  return data as Order;
}

export async function getActiveOrderCount(): Promise<number> {
  const { supabase, userId } = await getUserId();
  await ensureDefaultStages(supabase, userId);

  // Get the final stage name (highest sort_order)
  const { data: stages } = await supabase
    .from('order_stages')
    .select('name')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const finalStageName = stages?.[0]?.name;
  if (!finalStageName) return 0;

  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('stage', finalStageName);

  return count ?? 0;
}
