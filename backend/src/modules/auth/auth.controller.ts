import { RegisterUser, LoginUser } from "./auth.service";
import { LoginSchema, RegisterSchema, TokenSchema } from "./auth.schema";
import { Request, Response } from "express";
import { logoutUser, rotateRefreshToken } from "./token.service";

export async function register(req: Request, res: Response) {
    try {
        const user = RegisterSchema.parse(req.body);

        const accessedRegister = await RegisterUser(user);
        if (accessedRegister) {
            return res.status(201).json({ message: `Удачная регистрация, данные:`, data: accessedRegister })
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Произошла неизвестная ошибка';
        return res.status(400).json({ error: message })
    }
}

export async function login(req: Request, res: Response) {
    try {
        const user = LoginSchema.parse(req.body);
        const accessedLogin = await LoginUser(user);

        if (accessedLogin) {
            return res.status(200).json({ message: `Удачная авторизация, данные: `, data: accessedLogin })
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Произошла неизвестная ошибка';
        return res.status(401).json({ error: message })
    }
}

export async function refresh(req: Request, res: Response) {
    try {
        const token = TokenSchema.parse(req.body).refreshToken;
        const result = await rotateRefreshToken(token);

        return res.status(200).json(result);
    } catch {
        return res.status(401).json({ message: 'Произошла ошибка обработки обновления токена' })
    }
}

export async function logout(req: Request, res: Response) {
    try {
        const token = TokenSchema.parse(req.body).refreshToken;
        //Удаляем токен в бд
        await logoutUser(token);
        return res.status(200).json({ message: "Вы вышли из системы" });
    } catch {
        return res.status(400).json({ message: "Неудачный выход из системы" });
    }
}