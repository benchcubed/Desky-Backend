import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { CreateUserInput, createUserSchema, User } from "../../models/userSchema";
import { ddbDocClient } from "../../clients/ddb";

const USERS_TABLE = process.env.USERS_TABLE_NAME || "";

export const fetchUserById = async (userId: string): Promise<User | null> => {
    const params = {
        TableName: USERS_TABLE,
        Key: { id: userId },
    };

    const result = await ddbDocClient.send(new QueryCommand(params));
    if (result.Items && result.Items.length > 0) {
        return result.Items[0] as User;
    }
    return null;
};

export const fetchUserByEmail = async (email: string): Promise<User | null> => {
    const params = {
        TableName: USERS_TABLE,
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
            ":email": email,
        },
    };

    const result = await ddbDocClient.send(new QueryCommand(params));
    if (result.Items && result.Items.length > 0) {
        return result.Items[0] as User;
    }
    return null;
};

export const createUser = async (data: CreateUserInput): Promise<User> => {
    const parsedData = createUserSchema.parse(data);
    const userId = uuid();

    const item: User = {
        id: userId,
        createdAt: new Date().getTime(),
        ...parsedData,
    };

    const params = {
        TableName: USERS_TABLE,
        Item: item,
        ConditionExpression: "attribute_not_exists(email)", // prevent overwrite if email exists
    };

    await ddbDocClient.send(new PutCommand(params));
    return item;
};
