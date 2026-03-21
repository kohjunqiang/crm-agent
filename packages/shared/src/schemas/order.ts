import { z } from 'zod';

// Order stage config
export const OrderStageConfigSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  sort_order: z.number().int(),
  color: z.string(),
  created_at: z.string(),
});

export const CreateOrderStageConfigSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  sort_order: z.number().int().optional(),
});

export const UpdateOrderStageConfigSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  sort_order: z.number().int().optional(),
});

// Order item (immutable snapshot)
export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  product_id: z.string().uuid().nullable(),
  product_variant_id: z.string().uuid().nullable(),
  name: z.string(),
  qty: z.number().int(),
  unit_price: z.number(),
  width_cm: z.number().nullable(),
  drop_cm: z.number().nullable(),
  room_name: z.string().nullable(),
  window_position: z.string().nullable(),
  fixing_type: z.string().nullable(),
  stack_direction: z.string().nullable(),
  lining_type: z.string().nullable(),
  motorization: z.string().nullable(),
  notes: z.string().nullable(),
  sort_order: z.number().int(),
  created_at: z.string(),
});

// Order
export const OrderSchema = z.object({
  id: z.string().uuid(),
  deal_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  user_id: z.string().uuid(),
  order_number: z.string(),
  title: z.string(),
  stage: z.string(),
  total_amount: z.number(),
  notes: z.string().nullable(),
  delivery_address: z.string().nullable(),
  delivery_date: z.string().nullable(),
  delivery_notes: z.string().nullable(),
  assigned_to: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UpdateOrderSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  delivery_address: z.string().nullable().optional(),
  delivery_date: z.string().nullable().optional(),
  delivery_notes: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
});

// Order stage history
export const OrderStageHistorySchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  from_stage: z.string().nullable(),
  to_stage: z.string(),
  changed_by: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
});

// Inferred types
export type OrderStageConfig = z.infer<typeof OrderStageConfigSchema>;
export type CreateOrderStageConfigInput = z.infer<typeof CreateOrderStageConfigSchema>;
export type UpdateOrderStageConfigInput = z.infer<typeof UpdateOrderStageConfigSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type OrderStageHistory = z.infer<typeof OrderStageHistorySchema>;
