// src/models/userModel.ts
import { z } from "zod";

// Zod schema for user creation input validation
export const createUserSchema = z.object({
    email: z.string().email(),
    passwordHash: z.string().min(60).max(60), // assuming bcrypt hash length
    permissions: z.number().int().nonnegative(),
    firstName: z.string().min(1),
    surname: z.string().min(1),
    emailVerified: z.boolean().optional().default(false),
    emailVerificationToken: z.string().optional().nullable(),

    dateOfBirth: z.object({
        day: z.number().int().min(1).max(31),
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(1900).max(new Date().getFullYear())
    }),
    address: z.object({
        country: z.string().min(1),
        line1: z.string().min(1),
        line2: z.string().optional().nullable(),
        city: z.string().min(1),
        county: z.string().min(1),
        postalCode: z.string().min(1),
    }).optional().nullable(),
    phoneNumber: z.object({
        countryCode: z.string().min(1),
        number: z.string().min(1)
    }).optional().nullable(),
    profilePictureUrl: z.string().optional().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type User = CreateUserInput & {
    id: string;
    createdAt: number; // timestamp
};
