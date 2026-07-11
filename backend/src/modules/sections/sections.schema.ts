import z from 'zod';


export const CreateSectionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2_000).optional(),
  visibility: z.enum(["public", "private"]).default("public")
});

export type CreateSectionInput = z.infer<typeof CreateSectionSchema>;
