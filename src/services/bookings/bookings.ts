
// DynamoDB query logic (AWS SDK v3)
import { DynamoDBClient, QueryCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { OfficeBooking, officeBookingSchema } from "../../models/booking";
import { getEnvVarOrFallback, getEnvVarOrThrow } from "../../utils/getEnvVarsOrThrow";
import { ddbDocClient } from "../../clients/ddb";
import { DeleteCommand, DeleteCommandInput, PutCommand, PutCommandInput, QueryCommandInput, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { isMultipleOfXMinutes } from "../../utils/math";
import { ddbQuery } from "../../clients/ddb/utils";
import { BookingAtendee } from "../../models/bookingAtendee";

const OFFICE_BOOKINGS_TABLE_NAME = getEnvVarOrThrow<string>("OFFICE_BOOKINGS_TABLE_NAME");
const OFFICE_BOOKINGS_ATENDEES_TABLE_NAME = getEnvVarOrThrow<string>("OFFICE_BOOKINGS_ATENDEES_TABLE_NAME");
const BASE_BOOKING_CHUNK = getEnvVarOrFallback<number>("BASE_BOOKING_CHUNK", 15); // Default to 15 minutes if not set

/**
 * Checks if an element is available for a given time slot.
 */
export const isElementAvailable = async (
    elementId: string,
    desiredStart: number,
    desiredEnd: number
): Promise<boolean> => {
    const result = await ddbDocClient.send(new QueryCommand({
        TableName: OFFICE_BOOKINGS_TABLE_NAME,
        KeyConditionExpression: "bookingId = :elementId AND startTime < :desiredEnd",
        FilterExpression: "endTime > :desiredStart AND #status = :confirmed",
        ExpressionAttributeNames: {
            "#status": "status"
        },
        ExpressionAttributeValues: {
            ":bookingId": { S: elementId },
            ":desiredStart": { N: desiredStart.toString() },
            ":desiredEnd": { N: desiredEnd.toString() },
            ":confirmed": { S: "CONFIRMED" }
        }
    }));
    return (result.Items?.length ?? 0) === 0;
}

/**
 * Creates a booking if the element is available.
 */
export const createBooking = async (
    officeBooking: OfficeBooking
): Promise<{ success: boolean; message: string }> => {
    if (isMultipleOfXMinutes(officeBooking.startTime, 15) === false || isMultipleOfXMinutes(officeBooking.endTime, 15) === false) {
        return { success: false, message: "Start and end times must be multiples of 15 minutes." };
    }
    const available = await isElementAvailable(officeBooking.bookingId, officeBooking.startTime, officeBooking.endTime);
    if (!available) {
        return { success: false, message: "Element is already booked for this time range." };
    }

    const params: PutCommandInput = {
        TableName: OFFICE_BOOKINGS_TABLE_NAME,
        Item: officeBooking,
        ConditionExpression: "attribute_not_exists(bookingId)",
    };
    await ddbDocClient.send(new PutCommand(params));

    return { success: true, message: "Booking created." };
}

export const ammendBooking = async (
    bookingId: string,
    updates: Partial<OfficeBooking>
): Promise<{ success: boolean; message: string }> => {
    const { startTime, endTime } = updates;
    if (startTime && endTime) {
        const available = await isElementAvailable(updates.bookingId || "", startTime, endTime);
        if (!available) {
            return { success: false, message: "Element is already booked for this time range." };
        }
    }
    const params: UpdateCommandInput = {
        TableName: OFFICE_BOOKINGS_TABLE_NAME,
        Key: { bookingId },
        UpdateExpression: "set #bookingName = :bookingName, #description = :description, #attendees = :attendees, #startTime = :startTime, #endTime = :endTime",
        ExpressionAttributeNames: {
            "#bookingName": "bookingName",
            "#description": "description",
            "#startTime": "startTime",
            "#endTime": "endTime",
        },
        ExpressionAttributeValues: {
            ":bookingName": updates.bookingName,
            ":description": updates.description,
            ":startTime": startTime,
            ":endTime": endTime,
        },
        ConditionExpression: "attribute_exists(bookingId)",
    };
    await ddbDocClient.send(new UpdateCommand(params));
    return { success: true, message: "Booking amended." };
};

/**
 * Deletes a booking by bookingId.
 */
export const deleteBooking = async (bookingId: string): Promise<{ success: boolean; message: string }> => {
    const params: DeleteCommandInput = {
        TableName: OFFICE_BOOKINGS_TABLE_NAME,
        Key: { bookingId },
        ConditionExpression: "attribute_exists(bookingId)",
    };
    try {
        await ddbDocClient.send(new DeleteCommand(params));
        return { success: true, message: "Booking deleted." };
    } catch (error) {
        console.error("Error deleting booking:", error);
        return { success: false, message: "Failed to delete booking." };
    }
}

export const getBookingById = async (bookingId: string): Promise<OfficeBooking> => {
    const params: QueryCommandInput = {
        TableName: OFFICE_BOOKINGS_TABLE_NAME,
        KeyConditionExpression: "bookingId = :bookingId",
        ExpressionAttributeValues: {
            ":bookingId": { S: bookingId },
        },
    };
    const result = await ddbDocClient.send(new QueryCommand(params));
    if (!result.Items || result.Items.length <= 0) {
        throw new Error(`Booking with ID ${bookingId} not found.`);
    }

    if (result.Items?.length > 1) {
        console.warn(`Multiple bookings found for ID ${bookingId}. Returning the first one.`);
    }
    if (!result.Items[0]) {
        throw new Error(`Booking with ID ${bookingId} not found.`);
    }
    const parsed = officeBookingSchema.safeParse(result.Items[0]);
    if (!parsed.success) {
        console.error("Failed to parse booking data:", parsed.error);
        throw new Error(`Booking with ID ${bookingId} is invalid.`);
    }
    return parsed.data;
};

/**
 * Fetches all attendees for a booking by bookingId.
 */
export const getBookingAttendees = async (bookingId: string): Promise<string[]> => {
    const response = await ddbQuery<BookingAtendee>(
        OFFICE_BOOKINGS_ATENDEES_TABLE_NAME, 'pk',
        `#USER${bookingId}`
    );
    if(response.length <= 0) {
        throw new Error(`No atendees for booking: ${bookingId}.`);
    }
    return response.map(a => a.bookingId);
}