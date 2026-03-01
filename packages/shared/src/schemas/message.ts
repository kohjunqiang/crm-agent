import { z } from 'zod';
import { ChannelSchema } from './contact';

export const MessageDirectionSchema = z.enum(['inbound', 'outbound']);
export const MessageSenderSchema = z.enum(['lead', 'agent', 'human']);

export const MessageSchema = z.object({
  id: z.string().uuid(),
  contact_id: z.string().uuid(),
  user_id: z.string().uuid(),
  direction: MessageDirectionSchema,
  sender: MessageSenderSchema,
  channel: ChannelSchema,
  content: z.string(),
  external_id: z.string().nullable(),
  created_at: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

// For POST /api/contacts/:id/messages
export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
