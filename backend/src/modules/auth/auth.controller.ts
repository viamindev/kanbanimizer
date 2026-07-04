import * as authService from "./auth.service";
import * as authSchema from "./auth.schema";
import { Request, Response } from "express";
import * as tokenService from "./token.service";

export async function register(req: Request, res: Response) {
    try {
        const user = authSchema.RegisterSchema.parse(req.body);

        const accessedRegister = await authService.RegisterUser(user);
        if (accessedRegister) {
            return res.status(201).json({ message: 'Registration successful', data: accessedRegister })
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown registration error';
        return res.status(400).json({ error: message })
    }
}

export async function login(req: Request, res: Response) {
    try {
        const user = authSchema.LoginSchema.parse(req.body);
        const accessedLogin = await authService.LoginUser(user);

        if (accessedLogin) {
            return res.status(200).json({ message: 'Authentication successful', data: accessedLogin })
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown login error';
        return res.status(401).json({ error: message })
    }
}

export async function refresh(req: Request, res: Response) {
    try {
        const token = authSchema.TokenSchema.parse(req.body).refreshToken;
        const result = await tokenService.rotateRefreshToken(token);

        return res.status(200).json(result);
    } catch {
        return res.status(401).json({ message: 'Unknown token refresh error' })
    }
}

export async function logout(req: Request, res: Response) {
    try {
        const token = authSchema.TokenSchema.parse(req.body).refreshToken;
        await tokenService.logoutUser(token);
        return res.status(200).json({ message: "Logout successful" });
    } catch {
        return res.status(400).json({ message: "Unknown logout error" });
    }
}