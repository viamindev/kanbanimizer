import {z} from 'zod';


export const CreateSectionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2_000).optional().nullable(),
  accessScope: z.enum(["project", "restricted"]).default("project")
});

// export const UpdateSectionSchema = z.object({
//   name: z.string()
// })

export type CreateSectionInput = z.infer<typeof CreateSectionSchema>;

export const UpdateSectionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .optional(),

    description: z
      .string()
      .trim()
      .max(2_000)
      .nullable()
      .optional(),

    accessScope: z
      .enum(["project", "restricted"])
      .optional(),
  })
  .refine(
    (input) =>
      input.name !== undefined ||
      input.description !== undefined ||
      input.accessScope !== undefined,
    {
      message: "At least one field must be provided",
    },
  );
