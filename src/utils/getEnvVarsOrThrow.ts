import { ZodSchema, ZodError, z } from "zod";

// Zod schema for current env vars in serverless.yml
export const envSchema = z.object({
    USER_JWT_SECRET_NAME: z.string(),
    USERS_TABLE_NAME: z.string(),
    OFFICES_TABLE_NAME: z.string(),
    OFFICE_MEMBERSHIPS_TABLE_NAME: z.string(),
    VERIFICATION_EMAIL_FROM: z.string().email(),
    OFFICES_S3_BUCKET_NAME: z.string(),
    // Add more as needed
});

/**
 * Validates process.env against the provided Zod schema.
 * Throws if validation fails, or returns the parsed env vars.
 * Optionally, you can provide a fallback object for defaults.
 */
export function getEnvVarsOrThrow<T>(schema: ZodSchema<T>, fallback?: Partial<T>): T {
    // Merge process.env and fallback (fallback takes lower precedence)
    const merged = { ...fallback, ...process.env };
    const result = schema.safeParse(merged);
    if (!result.success) {
        throw new Error(
            `Environment variable validation failed: ${result.error.message}`
        );
    }
    return result.data;
}

/**
 * Gets a specific environment variable by name, throws if not set or empty.
 * Optionally, you can provide a Zod schema for validation.
 */
export function getEnvVarOrThrow<T = string>(
    name: string,
    schema?: ZodSchema<T>,
    fallback?: T
): T {
    const value = process.env[name] ?? fallback;
    if (value === undefined || value === null || value === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    if (schema) {
        const result = schema.safeParse(value);
        if (!result.success) {
            throw new Error(
                `Environment variable validation failed for ${name}: ${result.error.message}`
            );
        }
        return result.data;
    }
    return value as T;
}

/**
 * Gets an environment variable by name, returns a fallback value if not set or empty.
 */
export const getEnvVarOrFallback = <T = string>(
    name: string,
    fallback: T,
    schema?: ZodSchema<T>
): T => {
    const value = process.env[name] ?? fallback;
    if (value === undefined || value === null || value === "") {
        return fallback;
    }
    if (schema) {
        const result = schema.safeParse(value);
        if (!result.success) {
            throw new Error(
                `Environment variable validation failed for ${name}: ${result.error.message}`
            );
        }
        return result.data;
    }
    return value as T;
}