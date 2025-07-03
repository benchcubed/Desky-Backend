import { z } from "zod"

const officeElementTypesSchema = z.enum(['DESK', 'WALL', 'CHAIR', 'PLANT'])

const officeElementSchema = z.object({
    isBookable: z.boolean().optional().default(false),
    position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
        length: z.number().optional().default(1),
        width: z.number().optional().default(1),
    }),
    type: officeElementTypesSchema
}).array()

const officeSchema = z.object({
    id: z.string().uuid(),
    owner: z.string().uuid(),
    createdAt: z.number(),
    lastModified: z.number(), // TODO office history type thing
    name: z.string(),
    description: z.object({
        short: z.string().min(1).max(200).optional(),
        long: z.string().min(1).max(1000).optional(),
    }).optional().default({
        short: '',
        long: '',
    }),
    elements: officeElementSchema.optional().nullable().default([]),
})

const createOfficeSchema = officeSchema.omit({
    id: true,
    owner: true,
    createdAt: true,
    lastModified: true,
})

// should the elements be their own DDB table?
// or should they be part of the office table?


const createOfficeMembershipSchema = z.object({
    officeId: z.string().uuid(),
    userId: z.string().uuid(),
    role: z.enum(['OWNER', 'MEMBER', 'ADMIN']).default('OWNER'),
});

const addOfficeMembershipSchema = z.object({
    officeId: z.string().uuid(),
    userIdToAdd: z.string().uuid(),
    addedByUserId: z.string().uuid(),
    role: z.enum(['OWNER', 'MEMBER', 'ADMIN']).default('MEMBER'),
    override: z.boolean().optional().default(false),
});

type AddOfficeMembershipRequest = z.infer<typeof addOfficeMembershipSchema>;

type CreateOfficeMembershipRequest = z.infer<typeof createOfficeMembershipSchema>;
type OfficeMembership = z.infer<typeof createOfficeMembershipSchema>;

type OfficeElement = z.infer<typeof officeElementSchema>
type OfficeElementTypes = z.infer<typeof officeElementTypesSchema>
type Office = z.infer<typeof officeSchema>

type CreateOfficeRequest = z.infer<typeof createOfficeSchema>
const removeOfficeMemberSchema = z.object({
    officeId: z.string().uuid(),
    userIdToRemove: z.string().uuid(),
    removedByUserId: z.string().uuid(),
    override: z.boolean().optional().default(false),
});

type RemoveOfficeMemberInput = z.infer<typeof removeOfficeMemberSchema>;

export {
    officeElementSchema,
    officeElementTypesSchema,
    officeSchema,
    createOfficeSchema,
    createOfficeMembershipSchema,
    addOfficeMembershipSchema,
    removeOfficeMemberSchema,
    RemoveOfficeMemberInput,
    AddOfficeMembershipRequest,
    OfficeElement,
    OfficeElementTypes,
    Office,
    CreateOfficeRequest,
    CreateOfficeMembershipRequest,
    OfficeMembership
}
