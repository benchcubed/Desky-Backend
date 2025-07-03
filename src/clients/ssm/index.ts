import {
    SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });