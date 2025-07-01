import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import { createOfficeSchema, Office } from "../../models/officeSchma";
import { requireAuth } from "../../services/auth/requireAuth";
import { saveOffice } from "../../services/office/office";
import { createOfficeMembership } from "../../services/office/officeMembership";

import { v4 as uuid } from "uuid";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    const authResponse = await requireAuth(event);
    if (!authResponse) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: "Unauthorized" })
        };
    }

    if (!event.body) {
        console.log('No body in event');
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Request body is required' }),
        };
    }
    const body = createOfficeSchema.safeParse(event.body || '{}');

    if (!body.success) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: body.error.errors }),
        };
    }

    const officeId = uuid();
    const office: Office = {
        ...body.data,
        createdAt: new Date().getTime(),
        lastModified: new Date().getTime(),
        id: officeId,
        owner: authResponse.id,
    }

    await Promise.all([
        saveOffice(office),
        createOfficeMembership({
            officeId: office.id,
            userId: authResponse.id,
            role: 'OWNER',
        }),
    ])

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Office created successfully',
            office,
        }),
    }
}