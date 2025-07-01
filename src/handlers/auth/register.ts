// src/handlers/register.ts
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { registerSchema } from '../../models/authSchema';
import { register } from '../../services/auth/auth';
import { sendVerificationEmail } from '../../utils/sendVerificationEmail';


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    if (!event.body) {
        console.log('No body in event');
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Request body is required' }),
        };
    }
    const body = registerSchema.safeParse(event.body || '{}');
    if (!body.success) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: body.error.errors }),
        };
    }
    const { email, password, firstName, surname, dateOfBirth } = body.data;

    const newUser = await register({ email, firstName, surname, password, dateOfBirth })
    if (!newUser) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to create user' }),
        };
    }

    await sendVerificationEmail(email, newUser.emailVerificationToken);

    return {
        statusCode: 201,
        body: JSON.stringify({ message: 'User created', userId: newUser.userId }),
    }
};

