import {z} from 'zod';


export const CreateSectionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2_000).optional().nullable(),
  accessScope: z.enum(["project", "restricted"]).default("project")
});

export type CreateSectionInput = z.infer<typeof CreateSectionSchema>;
