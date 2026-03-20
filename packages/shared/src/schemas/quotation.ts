import { z } from 'zod';
import { DealProductSchema } from './deal';

export const QuotationStatusSchema = z.enum(['draft', 'sent']);

export const QuotationSchema = z.object({
  id: z.string().uuid(),
  deal_id: z.string().uuid(),
  user_id: z.string().uuid(),
  quotation_number: z.string(),
  items: z.array(DealProductSchema),
  subtotal: z.number(),
  gst_rate: z.number(),
  gst_amount: z.number(),
  total: z.number(),
  terms: z.string().nullable(),
  validity_days: z.number().nullable(),
  status: QuotationStatusSchema,
  pdf_path: z.string().nullable(),
  created_at: z.string(),
});

export type Quotation = z.infer<typeof QuotationSchema>;
