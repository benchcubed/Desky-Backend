import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    surname: z.string().min(1),
    dateOfBirth: z.object({
        day: z.number().int().min(1).max(31),
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(1900).max(new Date().getFullYear())
    }),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;