import { z } from 'zod';

export const NoteAuthorSchema = z.enum(['human', 'agent']);

export const NoteSchema = z.object({
  id: z.string().uuid(),
  contact_id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string(),
  author: NoteAuthorSchema,
  image_urls: z.array(z.string()).default([]),
  created_at: z.string(),
});

export const CreateNoteSchema = z.object({
  content: z.string().min(1),
  image_urls: z.array(z.string()).optional(),
});

export type Note = z.infer<typeof NoteSchema>;
export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
