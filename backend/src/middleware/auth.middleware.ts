import { type Request, type Response, type NextFunction } from "express";
import { verifyAccessToken } from "@/utils/jwt";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice(7);

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.userId = payload.userId;

  next();
};
