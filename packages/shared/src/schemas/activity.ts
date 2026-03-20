import { z } from 'zod';

export const ActivityActorSchema = z.enum(['human', 'agent', 'system']);

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  entity_type: z.string(),
  entity_id: z.string().uuid().nullable(),
  event_type: z.string(),
  actor: ActivityActorSchema,
  metadata: z.record(z.string(), z.any()).default({}),
  created_at: z.string(),
});

export type Activity = z.infer<typeof ActivitySchema>;
export type ActivityActor = z.infer<typeof ActivityActorSchema>;
