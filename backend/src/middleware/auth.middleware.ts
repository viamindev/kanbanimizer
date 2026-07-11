import { type Request, type Response, type NextFunction } from "express";
import { verifyAccessToken } from "@/utils/jwt";
import { UnauthorizedError } from "@/utils/errors";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return new UnauthorizedError;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return new UnauthorizedError;
  }

  req.user = {
    id: payload.userId,
  };

    next();
};
