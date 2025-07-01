import { GetCommand, PutCommand, TransactWriteCommand, TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { z } from "zod"
import { ddbDocClient } from "../../clients/ddb";
import { AddOfficeMembershipRequest, addOfficeMembershipSchema, CreateOfficeMembershipRequest, createOfficeMembershipSchema, createOfficeSchema, Office, OfficeMembership, RemoveOfficeMemberInput, removeOfficeMemberSchema } from "../../models/officeSchma";
import { v4 as uuid } from "uuid";

const OFFICE_MEMBERSHIPS_TABLE_NAME = process.env.OFFICE_MEMBERSHIPS_TABLE_NAME || "";
const OFFICES_TABLE_NAME = process.env.OFFICES_TABLE_NAME || "";

export const createOfficeMembership = async (
    data: CreateOfficeMembershipRequest
): Promise<CreateOfficeMembershipRequest> => {
    const parsed = createOfficeMembershipSchema.safeParse(data);
    if (!parsed.success) {
        console.error("Invalid office membership data:", parsed.error);
        throw new Error("Invalid office membership data");
    }

    const { officeId, userId, role = "GUEST" } = parsed.data;

    const transactParams: TransactWriteCommandInput = {
        TransactItems: [
            {
                Put: {
                    TableName: OFFICE_MEMBERSHIPS_TABLE_NAME,
                    Item: {
                        pk: `USER#${userId}`,
                        sk: officeId,
                        role,
                    },
                    ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
                },
            },
            {
                Put: {
                    TableName: OFFICE_MEMBERSHIPS_TABLE_NAME,
                    Item: {
                        pk: `OFFICE#${officeId}`,
                        sk: userId,
                        role,
                    },
                    ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
                },
            },
        ],
    };

    try {
        await ddbDocClient.send(new TransactWriteCommand(transactParams));
        return parsed.data;
    } catch (err: any) {
        console.error("Failed to create office membership:", err);
        if (err.name === "TransactionCanceledException") {
            throw new Error("Membership already exists or conflict occurred.");
        }
        throw err;
    }
};

export const addMemberToOffice = async (data: AddOfficeMembershipRequest & { override?: boolean }): Promise<void> => {
    const parsed = addOfficeMembershipSchema.safeParse(data);
    if (!parsed.success) throw new Error("Invalid input to addMemberToOffice");

    const { officeId, userIdToAdd, addedByUserId, role, override = false } = parsed.data;

    const assertionResponses = await Promise.all([
        assertOfficeExists(officeId),
        assertUserHasRole(officeId, userIdToAdd, ['ADMIN', 'OWNER'], override),
        assertUserIsNotMember(officeId, userIdToAdd),
    ]);

    if (!assertionResponses.every(res => res.success)) {
        const errors = assertionResponses.filter(res => !res.success).map(res => res.error?.message).join(", ");
        throw new Error(`Failed to add member: ${errors}`);
    }

    await createOfficeMembership({ officeId, userId: userIdToAdd, role });

    console.log(`User ${addedByUserId} added user ${userIdToAdd} to office ${officeId} as ${role} (override=${override})`);
};

export const removeMemberFromOffice = async (data: RemoveOfficeMemberInput): Promise<void> => {
    const parsed = removeOfficeMemberSchema.safeParse(data);
    if (!parsed.success) throw new Error("Invalid input to removeMemberFromOffice");

    const { officeId, userIdToRemove, removedByUserId, override = false } = parsed.data;

    const assertionResponses = await Promise.all([
        assertOfficeExists(officeId),
        assertUserHasRole(officeId, removedByUserId, ['ADMIN', 'OWNER'], override),
        assertUserIsMember(officeId, userIdToRemove),
    ]);

    if (!assertionResponses.every(res => res.success)) {
        const errors = assertionResponses.filter(res => !res.success).map(res => res.error?.message).join(", ");
        throw new Error(`Failed to remove member: ${errors}`);
    }

    const transactParams: TransactWriteCommandInput = {
        TransactItems: [
            {
                Delete: {
                    TableName: OFFICE_MEMBERSHIPS_TABLE_NAME,
                    Key: {
                        pk: `USER#${userIdToRemove}`,
                        sk: officeId,
                    },
                    ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
                },
            },
            {
                Delete: {
                    TableName: OFFICE_MEMBERSHIPS_TABLE_NAME,
                    Key: {
                        pk: `OFFICE#${officeId}`,
                        sk: userIdToRemove,
                    },
                    ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
                },
            },
        ],
    };

    try {
        await ddbDocClient.send(new TransactWriteCommand(transactParams));
        console.log(`User ${removedByUserId} removed user ${userIdToRemove} from office ${officeId} (override=${override})`);
    } catch (err: any) {
        console.error("Failed to remove office membership:", err);
        if (err.name === "TransactionCanceledException") {
            throw new Error("Membership removal failed or membership does not exist.");
        }
        throw err;
    }
};

const assertOfficeExists = async (officeId: string): Promise<AssertionResult> => {
    const result = await ddbDocClient.send(new GetCommand({ TableName: OFFICES_TABLE_NAME, Key: { id: officeId } }));
    if (!result.Item) return { success: false, error: new Error(`Office ${officeId} not found`) };
    return { success: true };
}

const assertUserHasRole = async (
    officeId: string,
    userId: string,
    allowedRoles: string[],
    override = false
): Promise<AssertionResult> => {
    if (override) return { success: true }; // skip checks if override is true

    const membership = await ddbDocClient.send(new GetCommand({
        TableName: OFFICE_MEMBERSHIPS_TABLE_NAME,
        Key: {
            pk: `USER#${userId}`,
            sk: officeId,
        },
    }));

    const userRole = membership.Item?.role;
    if (!allowedRoles.includes(userRole)) {
        return { success: false, error: new Error(`User ${userId} does not have permission. Required roles: ${allowedRoles.join(", ")}`) };
    }
    return { success: true };
}

const assertUserIsNotMember = async (officeId: string, userId: string): Promise<AssertionResult> => {
    const membership = await ddbDocClient.send(new GetCommand({
        TableName: OFFICE_MEMBERSHIPS_TABLE_NAME,
        Key: {
            pk: `USER#${userId}`,
            sk: officeId,
        },
    }));
    if (membership.Item) {
        return { success: false, error: new Error(`User ${userId} is already a member of office ${officeId}.`) };
    }
    return { success: true };
}

const assertUserIsMember = async (officeId: string, userId: string): Promise<AssertionResult> => {
    const membership = await ddbDocClient.send(new GetCommand({
        TableName: OFFICE_MEMBERSHIPS_TABLE_NAME,
        Key: {
            pk: `USER#${userId}`,
            sk: officeId,
        },
    }));
    if (!membership.Item) {
        return { success: false, error: new Error(`User ${userId} is not a member of office ${officeId}.`) };
    }
    return { success: true };
}
