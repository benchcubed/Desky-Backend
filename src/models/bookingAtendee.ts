import { z } from "zod";

const bookingAtendeeStatusEnum = z.enum(["CONFIRMED", "CANCELLED", "PENDING"]);

const bookingAtendeeSchema = z.object({
    bookingId: z.string().uuid(),
    userId: z.string().uuid(),
    status: bookingAtendeeStatusEnum.default("PENDING"),
    metadata: z.any().optional().default({}),
});

type BookingAtendee = z.infer<typeof bookingAtendeeSchema>;
type BookingAtendeeStatus = z.infer<typeof bookingAtendeeStatusEnum>;

export {
    bookingAtendeeSchema,
    BookingAtendee,
    BookingAtendeeStatus,
};