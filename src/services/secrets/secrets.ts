import {
    GetSecretValueCommand,
    CreateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { randomBytes } from "crypto";
import { secretsClient } from "../../clients/ssm";

export const SecretNameKeys = ["JWT_SECRET"] as const;
export type SecretNameKey = typeof SecretNameKeys[number];
const SecretNameValues: Record<SecretNameKey, string> = {
    JWT_SECRET: process.env.USER_JWT_SECRET_NAME ? `v1-${process.env.USER_JWT_SECRET_NAME}` : '',
};

// Internal cache
const cachedSecrets: Partial<Record<SecretNameKey, string>> = {
    JWT_SECRET: ""
};

// Fetch secret
const fetchSecretValue = async (key: SecretNameKey): Promise<string | undefined> => {
    const secretName = SecretNameValues[key];
    try {
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await secretsClient.send(command);
        if (response.SecretString) {
            cachedSecrets[key] = response.SecretString;
            return response.SecretString;
        }
        return undefined;
    } catch (err) {
        console.error(`Error fetching secret "${secretName}":`, err);
        return undefined;
    }
};

// Create secret
const createSecretValue = async (key: SecretNameKey, value: string): Promise<void> => {
    const secretName = SecretNameValues[key];
    try {
        const command = new CreateSecretCommand({
            Name: secretName,
            SecretString: value,
        });
        await secretsClient.send(command);
        cachedSecrets[key] = value;
        console.log(`Secret "${secretName}" created successfully.`);
        return;
    } catch (err) {
        console.error(`Error creating secret "${secretName}":`, err);
    }
};

// Public fetch-or-create
export const fetchOrCreateSecret = async (
    key: SecretNameKey,
    fallbackValue = randomBytes(32).toString('hex') // Default to a random hex string if no fallback is provided
): Promise<string> => {
    if (cachedSecrets[key]) {
        return cachedSecrets[key];
    }
    const existing = await fetchSecretValue(key);
    if (existing) return existing;

    if (fallbackValue !== undefined) {
        await createSecretValue(key, fallbackValue);
        return cachedSecrets[key] ?? fallbackValue;
    }
    throw new Error(`Secret "${key}" not found and no fallback provided.`);
};

export const clearCachedSecret = (key: SecretNameKey): void => {
    delete cachedSecrets[key];
};

export const clearAllCachedSecrets = (): void => {
    Object.keys(cachedSecrets).forEach(key => delete cachedSecrets[key as SecretNameKey]);
};
