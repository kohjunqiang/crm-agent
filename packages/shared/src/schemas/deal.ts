import { z } from 'zod';

export const DealStageSchema = z.enum([
  'discovery',
  'consultation',
  'quotation_sent',
  'confirmed',
  'ordered',
  'fulfilled',
  'completed',
  'lost',
]);

export const DealProductSchema = z.object({
  name: z.string(),
  qty: z.number().optional(),
  price: z.number().optional(),
});

export const DealSchema = z.object({
  id: z.string().uuid(),
  contact_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  amount: z.number().nullable(),
  currency: z.string(),
  stage: DealStageSchema,
  expected_close_date: z.string().nullable(),
  products: z.array(DealProductSchema).default([]),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateDealSchema = z.object({
  title: z.string().min(1),
  amount: z.number().nullable().optional(),
  currency: z.string().optional(),
  stage: DealStageSchema.optional(),
  expected_close_date: z.string().nullable().optional(),
  products: z.array(DealProductSchema).optional(),
  notes: z.string().nullable().optional(),
});

export const UpdateDealSchema = z.object({
  title: z.string().min(1).optional(),
  amount: z.number().nullable().optional(),
  currency: z.string().optional(),
  stage: DealStageSchema.optional(),
  expected_close_date: z.string().nullable().optional(),
  products: z.array(DealProductSchema).optional(),
  notes: z.string().nullable().optional(),
});

export type Deal = z.infer<typeof DealSchema>;
export type DealStage = z.infer<typeof DealStageSchema>;
export type DealProduct = z.infer<typeof DealProductSchema>;
export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;
