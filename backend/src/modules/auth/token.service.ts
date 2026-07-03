import { hashToken } from "@/utils/hash";
import ms from "ms";
import { env } from "@/config/env";
import { db } from "@/db";
import { eq } from 'drizzle-orm';
import { refreshTokensTable } from "@/db/schema/refreshTokens";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/utils/jwt";

export async function saveRefreshToken(userId: string, token: string) {
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as ms.StringValue));

    await db
        .insert(refreshTokensTable)
        .values({ userId, tokenHash, expiresAt });
}

//Обновляем refresh токен + обновляется access токен
export async function rotateRefreshToken(oldToken: string) {
    const isVerifiedRefreshToken = verifyRefreshToken(oldToken);
    if (!isVerifiedRefreshToken) {
        throw new Error('Refresh token expired or invalid')
    }
    const tokenHash = hashToken(oldToken);

    //Ищем токен в бд
    const [validToken] = await db
        .select()
        .from(refreshTokensTable)
        .where(eq(refreshTokensTable.tokenHash, tokenHash));

    if (!validToken) {
        throw new Error('Refresh token not found');
    }

    await db
        .delete(refreshTokensTable)
        .where(eq(refreshTokensTable.id, validToken.id));

    const accessToken = signAccessToken({ userId: validToken.userId });
    const refreshToken = signRefreshToken({ userId: validToken.userId });


    await saveRefreshToken(validToken.userId, refreshToken);

    return { accessToken, refreshToken }
}

export async function logoutUser(token: string) {
    const tokenHash = hashToken(token);

    await db
    .delete(refreshTokensTable)
    .where(eq(refreshTokensTable.tokenHash, tokenHash))
}