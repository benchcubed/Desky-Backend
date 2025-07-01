import z from 'zod';

export const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  surname: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  emailVerificationToken: z.string().uuid(),
});

export const validateVerifyEmail = (data: any) => verifyEmailSchema.safeParse(data);
export const validateRegistration = (data: any) => registrationSchema.safeParse(data);
export const validateLogin = (data: any) => loginSchema.safeParse(data);
