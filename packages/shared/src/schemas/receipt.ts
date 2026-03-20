import { z } from 'zod';

export const ReceiptSchema = z.object({
  id: z.string().uuid(),
  payment_id: z.string().uuid(),
  user_id: z.string().uuid(),
  receipt_number: z.string(),
  amount: z.number(),
  pdf_path: z.string().nullable(),
  created_at: z.string(),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
