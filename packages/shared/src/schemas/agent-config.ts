import { z } from 'zod';

export const AgentConfigSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  system_prompt: z.string(),
  whatsapp_phone_id: z.string().nullable(),
  whatsapp_token: z.string().nullable(),
  whatsapp_verify_token: z.string().nullable(),
  telegram_bot_token: z.string().nullable(),
  telegram_business_connection_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// For PUT /api/config
export const UpdateAgentConfigSchema = z.object({
  system_prompt: z.string().min(1).optional(),
  whatsapp_phone_id: z.string().optional(),
  whatsapp_token: z.string().optional(),
  whatsapp_verify_token: z.string().optional(),
  telegram_bot_token: z.string().optional(),
});
export type UpdateAgentConfigInput = z.infer<typeof UpdateAgentConfigSchema>;
