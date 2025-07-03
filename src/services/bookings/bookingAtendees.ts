import { BookingAtendee, bookingAtendeeSchema, BookingAtendeeStatus } from "../../models/bookingAtendee";
import { ddbRecordExists, ddbTransactWrite, ddbUpdateItem } from "../../clients/ddb/utils";
import { ServiceResponse } from "../serviceResponse";

const OFFICE_BOOKINGS_ATENDEES_TABLE_NAME = process.env.OFFICE_BOOKINGS_ATENDEES_TABLE_NAME || "";

export const createBookingAtendee = async (
    data: BookingAtendee
): Promise<ServiceResponse<any>> => {
    const parsed = bookingAtendeeSchema.safeParse(data);
    if (!parsed.success) {
        console.error("Invalid booking attendee data:", parsed.error);
        throw new Error("Invalid booking attendee data");
    }
    const { bookingId, userId, status } = parsed.data;

    // Check if the booking exists
    const bookingExists = await ddbRecordExists(OFFICE_BOOKINGS_ATENDEES_TABLE_NAME, { pk: `BOOKING#${bookingId}`, sk: userId });
    if (!bookingExists) {
        throw new Error("Booking does not exist.");
    }
    // Check if the user is already an attendee
    const userExists = await ddbRecordExists(OFFICE_BOOKINGS_ATENDEES_TABLE_NAME, { pk: `USER#${userId}`, sk: bookingId });
    if (userExists) {
        throw new Error("User is already an attendee for this booking.");
    }

    const transactParams = [
        {
            Put: {
                TableName: OFFICE_BOOKINGS_ATENDEES_TABLE_NAME,
                Item: {
                    pk: `USER#${userId}`,
                    sk: bookingId,
                    status,
                },
                ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
            },
        },
        {
            Put: {
                TableName: OFFICE_BOOKINGS_ATENDEES_TABLE_NAME,
                Item: {
                    pk: `BOOKING#${data.bookingId}`,
                    sk: userId,
                    status,
                },
                ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
            },
        },
    ];
    if (await ddbTransactWrite(transactParams)) {
        return { success: true, data: "Booking attendee created." };
    }
    return { success: false, data: "Failed to create booking attendee." };
};

export const updateBookingAtendeeStatus = async (
    bookingId: string,
    userId: string,
    status: BookingAtendeeStatus
): Promise<ServiceResponse<any>> => {
    return await ddbUpdateItem(
        OFFICE_BOOKINGS_ATENDEES_TABLE_NAME,
        {
            pk: `USER#${userId}`,
            sk: bookingId,
        },
        {
            status
        },
    ) ? { success: true, data: "Booking attendee status updated." }
        : { success: false, data: "Failed to update booking attendee status." };
}