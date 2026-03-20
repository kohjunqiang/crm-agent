import { z } from 'zod';

export const ContactStatusSchema = z.enum(['new', 'engaged', 'qualified', 'converted']);
export const ChannelSchema = z.enum(['whatsapp', 'telegram']);

export const ContactContextSchema = z.object({
  needs: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  objections: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
  summary: z.string().optional(),
}).passthrough();

export const ContactSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  company: z.string().nullable(),
  telegram_chat_id: z.string().nullable(),
  telegram_business_connection_id: z.string().nullable(),
  channel: ChannelSchema,
  status: ContactStatusSchema,
  agent_enabled: z.boolean(),
  last_message_at: z.string().nullable(),
  last_message_preview: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).default({}),
  context: ContactContextSchema.default({}),
  tags: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Contact = z.infer<typeof ContactSchema>;
export type ContactStatus = z.infer<typeof ContactStatusSchema>;
export type ContactContext = z.infer<typeof ContactContextSchema>;
export type Channel = z.infer<typeof ChannelSchema>;

// For PATCH /api/contacts/:id
export const UpdateContactSchema = z.object({
  status: ContactStatusSchema.optional(),
  agent_enabled: z.boolean().optional(),
  name: z.string().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  context: ContactContextSchema.optional(),
});
export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;
