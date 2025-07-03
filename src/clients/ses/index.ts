import { SESClient } from "@aws-sdk/client-ses";

export const sesClient = new SESClient({ region: process.env.AWS_REGION });
export const BASE_EMAIL_FROM = process.env.VERIFICATION_EMAIL_FROM || "";