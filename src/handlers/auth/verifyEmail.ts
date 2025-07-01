import { fetchUserByEmail } from "../../services/user/user";
import { clearEmailVerificationToken, verifyUser } from "../../services/user/verification";

import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { verifyEmailSchema } from '../../utils/validation';
import { HttpError } from "../../utils/errors";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    if (!event.body) {
        console.log('No body in event');
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Request body is required' }),
        };
    }
    const body = verifyEmailSchema.safeParse(event.body || '{}');
    if (!body.success) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: body.error.errors }),
        };
    }
    const { email, emailVerificationToken } = body.data;
    const user = await fetchUserByEmail(email);
    if (!user) {
        throw new HttpError(404, "User not found");
    }
    if (user.emailVerified) {
        return {
            statusCode: 304,
            body: JSON.stringify({ message: "User already verified" }),
        };
    }
    if (emailVerificationToken !== user.emailVerificationToken) {
        await clearEmailVerificationToken(user.id);
        throw new HttpError(400, "Invalid or expired verification token");
    }

    await verifyUser(user.id);
    return {
        statusCode: 200,
        body: JSON.stringify({})
    };
}