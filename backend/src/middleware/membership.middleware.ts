import { type Request, type Response, type NextFunction } from "express";
import { projectMemberTable } from '@/db/schema/projectMembers';
import { db } from "@/db/index";
import { eq, and } from 'drizzle-orm';
import { ForbiddenError, UnauthorizedError } from "@/utils/errors";


export function requireMembership(projectIdParam = "projectId") {
  return async (
    req: Request<Record<string, string>>,
    _res: Response,
    next: NextFunction
  ) => {
    const projectId = req.params[projectIdParam];
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError();
    }

    if (!projectId) {
      throw new ForbiddenError();
    }

    const [membership] = await db
          .select({ role: projectMemberTable.role })
          .from(projectMemberTable)
          .where(
            and(
              eq(projectMemberTable.userId, userId),
              eq(projectMemberTable.projectId, projectId),
            ),
          );

    if (!membership) {
      throw new ForbiddenError();
    }

    req.membership = {
      projectId,
      role: membership.role,
    }

    next();
  };
}
