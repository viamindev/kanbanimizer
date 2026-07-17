import { type Request, type Response, type NextFunction } from "express";
import { projectMemberTable } from '@/db/schema/projectMembers';
import { projectsTable } from "@/db/schema/projects";
import { db } from "@/db/index";
import { eq, and } from 'drizzle-orm';
import { ForbiddenError, UnauthorizedError, NotFoundError } from "@/utils/errors";


export function requireMembership(projectIdParam = "projectId") {
  return async (
    req: Request<Record<string, string>>,
    _res: Response,
    next: NextFunction
  ) => {
    const projectId = req.params[projectIdParam];
    if (!projectId) throw new ForbiddenError();

    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const [access] = await db
      .select({
        ownerUserId: projectsTable.ownerUserId,
        memberRole: projectMemberTable.role,
      })
      .from(projectsTable)
      .leftJoin(
        projectMemberTable,
        and(
          eq(
            projectMemberTable.projectId,
            projectsTable.id,
          ),
          eq(projectMemberTable.userId, userId),
        ),
      )
      .where(eq(projectsTable.id, projectId))
      .limit(1);

    if (!access) throw new NotFoundError("Project not found");

    const role =
      access.ownerUserId === userId
        ? "owner"
        : access.memberRole;

    if (!role) throw new ForbiddenError();

    req.membership = {
      projectId,
      role,
    };

    next();
  };
}
