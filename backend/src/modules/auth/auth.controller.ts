import { RegisterUser, LoginUser } from "./auth.service";
import { LoginSchema, RegisterSchema } from "./auth.schema";
import { Request, Response } from "express";

export async function register(req: Request, res: Response) {
    try {
        const user = RegisterSchema.parse(req.body);

        const accessedRegister = await RegisterUser(user);
        if (accessedRegister) {
            return res.status(201).json({ message: `Удачная регистрация, данные:`, data: accessedRegister })
        }
    } catch (e) {
        const message = e instanceof Error ? e.message:'Произошла неизвестная ошибка';
        return res.status(400).json({error: message})
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
        const message = e instanceof Error ? e.message:'Произошла неизвестная ошибка';
        return res.status(400).json({error: message})
    }
}