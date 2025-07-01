import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateLogin } from '../../utils/validation';
import { LoginData, RegisterData, registerSchema } from '../../models/authSchema';
import { Permissions } from '../../utils/permissions';
import { fetchOrCreateSecret } from '../secrets/secrets';
import { fetchUserByEmail, createUser } from '../user/user';
import { v4 as uuid } from 'uuid';

export const register = async (data: RegisterData) => {
    const result = registerSchema.safeParse(data || '{}');
    if (!result.success) {
        throw new Error('Invalid registration data: ' + result.error.errors.map(e => e.message).join(', '));
    }

    const { email, password, firstName, surname, dateOfBirth } = result.data;

    const existing = await fetchUserByEmail(email);
    if (existing) throw new Error('Email already in use');

    const emailVerificationToken = uuid();

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createUser({
        email,
        passwordHash,
        permissions: Permissions.NONE,
        firstName,
        surname,
        emailVerified: false,
        emailVerificationToken,
        dateOfBirth,
    });

    return {
        userId: newUser.id,
        emailVerificationToken,
    };
};

export const login = async (data: LoginData) => {
    const jwtSecret = await fetchOrCreateSecret('JWT_SECRET');
    if (!jwtSecret?.trim()) {
        throw new Error('JWT secret not found');
    }

    const { email, password } = data;
    const result = validateLogin({ email, password });
    if (!result.success) {
        throw new Error('Invalid login data: ' + result.error.errors.map(e => e.message).join(', '));
    }

    const { email: validatedEmail, password: validatedPassword } = result.data;

    const user = await fetchUserByEmail(validatedEmail);
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(validatedPassword, user.passwordHash);
    if (!isMatch) throw new Error('Invalid password');

    const token = jwt.sign({ id: user.id, permissions: user.permissions }, jwtSecret, { expiresIn: '1h' });
    return token
};
