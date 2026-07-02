import z from 'zod';

export const RegisterSchema = z.object({
    email: z.email().toLowerCase(),
    username: z.string().min(4).max(80),
    password: z.string().min(8)
});

export const LoginSchema = z.object({
    email: z.email().toLowerCase(),
    password: z.string().min(8)
})

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput =  z.infer<typeof LoginSchema>;