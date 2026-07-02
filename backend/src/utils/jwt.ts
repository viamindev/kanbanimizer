import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env'

export type AccessTokenPayload = { userId: string };

export function signAccessToken(payload: AccessTokenPayload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn']});
}

export function signRefreshToken(payload: AccessTokenPayload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_TTL as SignOptions['expiresIn']});
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
        return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
    } catch {
        return null
    }
}

export function verifyRefreshToken(token:string): AccessTokenPayload | null {
    try {
        return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessTokenPayload;
    } catch {
        return null
    }
}
