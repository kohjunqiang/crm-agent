import { z } from 'zod';

export const TaskStatusSchema = z.enum(['pending', 'done']);
export const TaskCreatorSchema = z.enum(['human', 'agent']);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  deal_id: z.string().uuid().nullable(),
  user_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.string().nullable(),
  status: TaskStatusSchema,
  created_by: TaskCreatorSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  deal_id: z.string().uuid().nullable().optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  status: TaskStatusSchema.optional(),
});

export type Task = z.infer<typeof TaskSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
