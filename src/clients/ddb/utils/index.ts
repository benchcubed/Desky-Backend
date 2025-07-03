import {
    DynamoDBClient,
    QueryCommandOutput,
    WriteRequest
} from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    TransactWriteCommand,
    BatchGetCommand,
    BatchWriteCommand,
    QueryCommand,
    UpdateCommandInput,
    TransactWriteCommandInput,
    BatchGetCommandInput,
    BatchWriteCommandInput,
    QueryCommandInput
} from "@aws-sdk/lib-dynamodb";

// Create Document Client
const client = new DynamoDBClient({});
export const ddbDocClient = DynamoDBDocumentClient.from(client);

/**
 * Helper: Build a key object with flexible key names
 */
export const buildKey = (
    partitionKey: string,
    partitionKeyName: string,
    sortKey?: string,
    sortKeyName?: string
): Record<string, string> => {
    const key: Record<string, string> = {
        [partitionKeyName]: partitionKey,
    };
    if (sortKey && sortKeyName) {
        key[sortKeyName] = sortKey;
    }
    return key;
};

/**
 * Check if a record exists
 */
export const ddbRecordExists = async (
    tableName: string, recordData: {
        pk: string;
        pkName?: string;
        sk?: string;
        skName?: string;
    }): Promise<boolean> => {
    try {
        const key = buildKey(recordData.pk, recordData.pkName || 'pk', recordData.sk, recordData.skName || 'sk');
        const result = await ddbDocClient.send(new GetCommand({ TableName: tableName, Key: key }));
        return !!result.Item;
    } catch (error) {
        console.error("[ddbRecordExists] Error:", error);
        return false;
    }
};

/**
 * Get an item
 */
export const ddbGetItem = async <T>(
    tableName: string,
    pk: string,
    pkName: string,
    sk?: string,
    skName?: string
): Promise<T | null> => {
    try {
        const key = buildKey(pk, pkName, sk, skName);
        const result = await ddbDocClient.send(new GetCommand({ TableName: tableName, Key: key }));
        return result.Item as T ?? null;
    } catch (error) {
        console.error("[ddbGetItem] Error:", error);
        return null;
    }
};

/**
 * Put (create or overwrite) an item
 */
export const ddbPutItem = async <T extends Record<string, unknown>>(
    tableName: string,
    item: T
): Promise<boolean> => {
    try {
        await ddbDocClient.send(new PutCommand({ TableName: tableName, Item: item }));
        return true;
    } catch (error) {
        console.error("[ddbPutItem] Error:", error);
        return false;
    }
};

/**
 * Update item attributes
 */
export const ddbUpdateItem = async <
    K extends Record<string, unknown>,
    U extends Record<string, unknown>
>(
    tableName: string,
    key: K,
    updates: U
): Promise<boolean> => {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};
    const expressionAttributeNames: Record<string, string> = {};

    for (const [attr, value] of Object.entries(updates)) {
        updateExpressions.push(`#${attr} = :${attr}`);
        expressionAttributeNames[`#${attr}`] = attr;
        expressionAttributeValues[`:${attr}`] = value;
    }

    const updateExpression = `SET ${updateExpressions.join(", ")}`;

    const params: UpdateCommandInput = {
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    };

    try {
        await ddbDocClient.send(new UpdateCommand(params));
        return true;
    } catch (error) {
        console.error("[ddbUpdateItem] Error:", error);
        return false;
    }
};

/**
 * Delete an item
 */
export const ddbDeleteItem = async (
    tableName: string,
    pk: string,
    pkName: string,
    sk?: string,
    skName?: string
): Promise<boolean> => {
    try {
        const key = buildKey(pk, pkName, sk, skName);
        await ddbDocClient.send(new DeleteCommand({ TableName: tableName, Key: key }));
        return true;
    } catch (error) {
        console.error("[ddbDeleteItem] Error:", error);
        return false;
    }
};

/**
 * Transact Write
 */
export const ddbTransactWrite = async (
    actions: TransactWriteCommandInput["TransactItems"]
): Promise<boolean> => {
    if (!actions?.length) return false;

    try {
        await ddbDocClient.send(new TransactWriteCommand({ TransactItems: actions }));
        return true;
    } catch (error) {
        console.error("[ddbTransactWrite] Error:", error);
        return false;
    }
};

/**
 * Batch Get
 */
export const ddbBatchGet = async <T>(
    tableName: string,
    keys: Record<string, unknown>[]
): Promise<T[]> => {
    const params: BatchGetCommandInput = {
        RequestItems: {
            [tableName]: {
                Keys: keys,
            },
        },
    };

    try {
        const result = await ddbDocClient.send(new BatchGetCommand(params));
        return (result.Responses?.[tableName] ?? []) as T[];
    } catch (error) {
        console.error("[ddbBatchGet] Error:", error);
        return [];
    }
};

/**
 * Batch Write (Put + Delete mixed)
 */

export const ddbBatchWrite = async (
    tableName: string,
    actions: WriteRequest[]
): Promise<boolean> => {
    const params: BatchWriteCommandInput = {
        RequestItems: {
            [tableName]: actions,
        },
    };

    try {
        await ddbDocClient.send(new BatchWriteCommand(params));
        return true;
    } catch (error) {
        console.error("[ddbBatchWrite] Error:", error);
        return false;
    }
};

/**
 * Query items by partition key or index
 */
export const ddbQuery = async <T>(
    tableName: string,
    partitionKeyName: string,
    partitionKeyValue: string,
    options?: {
        indexName?: string;
        sortKeyName?: string;
        sortKeyBeginsWith?: string;
        sortKeyEquals?: string;
        filterExpression?: string;
        limit?: number;
    }
): Promise<T[]> => {
    const {
        indexName,
        sortKeyName,
        sortKeyBeginsWith,
        sortKeyEquals,
        filterExpression,
        limit,
    } = options || {};

    let keyConditionExpression = `#pk = :pk`;
    const expressionAttributeNames: Record<string, string> = {
        "#pk": partitionKeyName,
    };
    const expressionAttributeValues: Record<string, unknown> = {
        ":pk": partitionKeyValue,
    };

    if (sortKeyName && sortKeyBeginsWith) {
        keyConditionExpression += ` AND begins_with(#sk, :sk)`;
        expressionAttributeNames["#sk"] = sortKeyName;
        expressionAttributeValues[":sk"] = sortKeyBeginsWith;
    }

    if (sortKeyName && sortKeyEquals) {
        keyConditionExpression += ` AND #sk = :sk`;
        expressionAttributeNames["#sk"] = sortKeyName;
        expressionAttributeValues[":sk"] = sortKeyEquals;
    }

    const params: QueryCommandInput = {
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        FilterExpression: filterExpression,
        Limit: limit,
    };

    try {
        const allResults: T[] = []
        let lastEvaluatedKey: Record<string, unknown> | undefined;

        do {
            const result = await ddbDocClient.send(new QueryCommand({
                ...params,
                ExclusiveStartKey: lastEvaluatedKey,
            })) as QueryCommandOutput;
            allResults.push(...(result.Items || []) as T[]);
            lastEvaluatedKey = result.LastEvaluatedKey;
        } while (lastEvaluatedKey)

        return allResults as T[];
    } catch (error) {
        console.error("[ddbQuery] Error:", error);
        return [];
    }
};