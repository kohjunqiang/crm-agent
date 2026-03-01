import { z } from 'zod';

export const ContactStatusSchema = z.enum(['new', 'engaged', 'qualified', 'converted']);
export const ChannelSchema = z.enum(['whatsapp', 'telegram']);

export const ContactSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  telegram_chat_id: z.string().nullable(),
  channel: ChannelSchema,
  status: ContactStatusSchema,
  agent_enabled: z.boolean(),
  last_message_at: z.string().nullable(),
  last_message_preview: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Contact = z.infer<typeof ContactSchema>;
export type ContactStatus = z.infer<typeof ContactStatusSchema>;
export type Channel = z.infer<typeof ChannelSchema>;

// For PATCH /api/contacts/:id
export const UpdateContactSchema = z.object({
  status: ContactStatusSchema.optional(),
  agent_enabled: z.boolean().optional(),
  name: z.string().optional(),
});
export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;
