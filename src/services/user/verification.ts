import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../../clients/ddb";

const USERS_TABLE = process.env.USERS_TABLE_NAME || "";

export const setEmailVerificationToken = async (
    userId: string,
    token: string
): Promise<void> => {
    const params = {
        TableName: USERS_TABLE,
        Key: { id: userId },
        UpdateExpression:
            `SET emailVerificationToken = :token, emailVerified = :emailVerified`,
        ExpressionAttributeValues: {
            ":token": token,
            ":emailVerified": false,
        },
    };

    await ddbDocClient.send(new UpdateCommand(params));
};

export const deleteEmailVerificationToken = async (
    userId: string
): Promise<void> => {
    const params = {
        TableName: USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: "REMOVE emailVerificationToken, emailVerified",
    };
    await ddbDocClient.send(new UpdateCommand(params));
};

export const verifyUser = async (userId: string): Promise<void> => {
    const params = {
        TableName: USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: "REMOVE emailVerificationToken SET emailVerified = :emailVerified",
        ExpressionAttributeValues: {
            ":emailVerified": true,
        },
    };

    await ddbDocClient.send(new UpdateCommand(params));
};

export const clearEmailVerificationToken = async (
    userId: string
): Promise<void> => {
    const params = {
        TableName: USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: "REMOVE emailVerificationToken",
    };

    await ddbDocClient.send(new UpdateCommand(params));
}   