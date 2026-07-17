import type { NextFunction, Request, Response } from "express";
import { can, type Action } from "@/utils/permissions";
import { ForbiddenError, UnauthorizedError } from "@/utils/errors";

export function requirePermission(action: Action) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const membership = req.membership;
    if (!membership || !can(membership.role, action, {userId})) throw new ForbiddenError();

    next();
  };
}
