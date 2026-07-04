import bcrypt from 'bcrypt';
import { db } from '@/db/index';
import { usersTable } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import * as authSchema from "@/modules/auth/auth.schema";
import * as jwtUtils from "@/utils/jwt";
import * as tokenService from "./token.service";


export async function RegisterUser({ email, username, password }: authSchema.RegisterInput) {
    const isEmailBusy = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (isEmailBusy.length > 0) throw new Error('Email already in use');

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await db.insert(usersTable).values({ email, username, passwordHash }).returning({ id: usersTable.id, email: usersTable.email, username: usersTable.username });

        if (user[0]) {
            const {id, email, username} = user[0];
            const accessToken = jwtUtils.signAccessToken({ userId: id });
            const refreshToken = jwtUtils.signRefreshToken({ userId: id });

            await tokenService.saveRefreshToken(id, refreshToken);

            return { user: { id, email, username}, accessToken, refreshToken}
        } else {
            console.error('Unexpected empty response from database')
        }

    } catch (e) {
        throw new Error('Database error during registration');
    }
}

export async function LoginUser({ email, password }: authSchema.LoginInput) {
    const foundUser = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (foundUser.length === 0) throw new Error('Incorrect email or password');

    const user = foundUser[0];
    if (!user) throw new Error('Incorrect email or password');

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) throw new Error('Incorrect email or password');

    try {
        const { id, username, email } = user;

        const accessToken = jwtUtils.signAccessToken({ userId: id });
        const refreshToken = jwtUtils.signRefreshToken({ userId: id });

        await tokenService.saveRefreshToken(id, refreshToken);
        return { user: { id, email, username }, accessToken: accessToken, refreshToken: refreshToken }
    } catch (e) {
        throw new Error('Database error during login')
    }
}