import { z } from 'zod';

export const KnowledgeBaseEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type KnowledgeBaseEntry = z.infer<typeof KnowledgeBaseEntrySchema>;

// For POST /api/knowledge
export const CreateKBEntrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});
export type CreateKBEntryInput = z.infer<typeof CreateKBEntrySchema>;

// For PUT /api/knowledge/:id
export const UpdateKBEntrySchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});
export type UpdateKBEntryInput = z.infer<typeof UpdateKBEntrySchema>;
