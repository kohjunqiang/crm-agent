import { z } from 'zod';

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  deal_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number(),
  label: z.string().nullable(),
  paid_at: z.string().nullable(),
  receipt_issued_at: z.string().nullable(),
  created_at: z.string(),
});

export const CreatePaymentSchema = z.object({
  amount: z.number().positive(),
  label: z.string().nullable().optional(),
  paid_at: z.string().nullable().optional(),
});

export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
