import z from 'zod';

export const CreateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(120),
  description: z
      .string()
      .trim()
      .max(2_000)
      .optional()
      .nullable(),
});

export const UpdateProjectSchema = z
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
  })
  .refine(
    (input) =>
      input.name !== undefined ||
      input.description !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export type CreateProjectSchema = z.infer<typeof CreateProjectSchema>;
