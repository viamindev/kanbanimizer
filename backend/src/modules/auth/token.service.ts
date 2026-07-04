import { hashToken } from "@/utils/hash";
import ms from "ms";
import { env } from "@/config/env";
import { db } from "@/db";
import { eq, lte, sql } from "drizzle-orm";
import { refreshTokensTable } from "@/db/schema/refreshTokens";
import * as jwtUtils from "@/utils/jwt";
import * as appError from "@/utils/errors";

export async function saveRefreshToken(userId: string, token: string) {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + ms(env.REFRESH_TOKEN_TTL as ms.StringValue),
  );

  await db.insert(refreshTokensTable).values({ userId, tokenHash, expiresAt });
}

export async function rotateRefreshToken(oldToken: string) {
  const isVerifiedRefreshToken = jwtUtils.verifyRefreshToken(oldToken);
  if (!isVerifiedRefreshToken) {
    throw new appError.UnauthorizedError("Refresh token expired or invalid");
  }
  const tokenHash = hashToken(oldToken);

  const [validToken] = await db
    .select()
    .from(refreshTokensTable)
    .where(eq(refreshTokensTable.tokenHash, tokenHash));

  if (!validToken) {
    throw new appError.UnauthorizedError("Refresh token not found");
  }

  await db
    .delete(refreshTokensTable)
    .where(eq(refreshTokensTable.id, validToken.id));

  const accessToken = jwtUtils.signAccessToken({ userId: validToken.userId });
  const refreshToken = jwtUtils.signRefreshToken({ userId: validToken.userId });

  await saveRefreshToken(validToken.userId, refreshToken);

  return { accessToken, refreshToken };
}

export async function logoutUser(token: string) {
  const tokenHash = hashToken(token);

  await db
    .delete(refreshTokensTable)
    .where(eq(refreshTokensTable.tokenHash, tokenHash));
}

export async function cleanExpiredRefreshTokens() {
  await db
    .delete(refreshTokensTable)
    .where(lte(refreshTokensTable.expiresAt, sql`now()`));
}
