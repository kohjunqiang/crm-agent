import { z } from 'zod';
import { DealProductSchema } from './deal';

export const InvoiceStatusSchema = z.enum(['draft', 'sent', 'paid', 'partially_paid']);

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  deal_id: z.string().uuid(),
  user_id: z.string().uuid(),
  invoice_number: z.string(),
  items: z.array(DealProductSchema),
  amount: z.number(),
  gst_rate: z.number(),
  gst_amount: z.number(),
  total: z.number(),
  due_date: z.string().nullable(),
  payment_terms: z.string().nullable(),
  status: InvoiceStatusSchema,
  pdf_path: z.string().nullable(),
  created_at: z.string(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;
