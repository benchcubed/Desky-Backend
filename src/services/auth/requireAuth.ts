import { APIGatewayProxyEvent } from "aws-lambda";
import jwt from "jsonwebtoken";
import { fetchOrCreateSecret } from "../secrets/secrets";
import { fetchUserByEmail } from "../user/user";
import { HttpError } from "../../utils/errors";

type TokenPayload = {
    id: string;
    iat?: number;
    exp?: number;
};

export const requireAuth = async (
    event: APIGatewayProxyEvent,
    requireActiveUser = false,
): Promise<TokenPayload> => {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        throw new HttpError(401, "Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];
    const secret = await fetchOrCreateSecret("JWT_SECRET");

    let payload: TokenPayload;
    try {
        payload = jwt.verify(token, secret) as TokenPayload;
    } catch (err) {
        console.error("JWT verification failed", err);
        throw new HttpError(401, "Invalid or expired token");
    }

    console.log('REQUIRED AUTH - Token payload:', payload);

    if (!payload?.id) {
        throw new HttpError(401, "Invalid token payload");
    }

    if (!requireActiveUser) {
        return payload;
    }

    console.log('REQUIRED AUTH - Verifying user:', payload.id);

    const user = await fetchUserByEmail(payload.id);
    if (!user) {
        throw new HttpError(404, "User not found");
    }

    if (!user.emailVerified) {
        throw new HttpError(403, "User email not verified");
    }

    console.log('REQUIRED AUTH - User found:', user.email);

    return payload;
};
