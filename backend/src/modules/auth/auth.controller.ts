import * as authService from "./auth.service";
import * as authSchema from "./auth.schema";
import * as tokenService from "./token.service";
import { type Request, type Response } from "express";

export async function register(req: Request, res: Response) {
  const input = authSchema.RegisterSchema.parse(req.body);
  const data = await authService.RegisterUser(input);
  return res.status(201).json({ message: "Registration successful", data });
}

export async function login(req: Request, res: Response) {
  const input = authSchema.LoginSchema.parse(req.body);
  const data = await authService.LoginUser(input);
  return res.status(200).json({ message: "Authentication successful", data });
}

export async function refresh(req: Request, res: Response) {
  const token = authSchema.TokenSchema.parse(req.body).refreshToken;
  const result = await tokenService.rotateRefreshToken(token);
  return res
    .status(200)
    .json({ message: "Refresh-token successful", data: result });
}

export async function logout(req: Request, res: Response) {
  const token = authSchema.TokenSchema.parse(req.body).refreshToken;
  await tokenService.logoutUser(token);
  return res.status(200).json({ message: "Logout successful" });
}
