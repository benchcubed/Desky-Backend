import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { loginSchema, validateLogin } from '../../utils/validation';
import { login } from '../../services/auth/auth';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    const body = loginSchema.safeParse(event.body || '{}');
    if (!body.success) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: body.error.errors }),
        };
    }
    const { email, password } = body.data;
    const token = await login({ email, password });
    return {
        statusCode: 200,
        body: JSON.stringify({ token }),
    };
}