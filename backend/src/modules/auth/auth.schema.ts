import z from 'zod';

export const RegisterSchema = z.object({
    email: z.email().toLowerCase(),
    username: z.string().min(4).max(80),
    password: z.string().min(8)
});

export const LoginSchema = z.object({
    email: z.email().toLowerCase(),
    password: z.string().min(8)
});

export const TokenSchema = z.object({
    refreshToken: z.string()
})

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput =  z.infer<typeof LoginSchema>;
export type TokenInput = z.infer<typeof TokenSchema>;