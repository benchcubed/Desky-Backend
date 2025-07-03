import { z } from "zod";

// Zod schema for a booking
const officeBookingSchema = z.object({
    bookingId: z.string().uuid(),
    officeId: z.string().uuid(),
    bookingName: z.string().min(1).max(100),
    description: z.string().min(1).max(500).optional().default(""),
    elementId: z.string().uuid(),
    userId: z.string().uuid(),
    startTime: z.number(), // Unix timestamp (ms)
    endTime: z.number(),
    createdAt: z.number(),
    status: z.enum(["CONFIRMED", "CANCELLED", "PENDING"]).default("CONFIRMED"),
    // Add more fields as needed
});

type OfficeBooking = z.infer<typeof officeBookingSchema>;

export {
    officeBookingSchema,
    OfficeBooking,
};
