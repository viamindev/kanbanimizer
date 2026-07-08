import { projectsTable } from '@/db/schema/projects';
import z from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
});

export type Project = typeof projectsTable.$inferSelect;
