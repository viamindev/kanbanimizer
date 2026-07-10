import { type Request, type Response, type NextFunction } from "express";
import { projectMemberTable } from '@/db/schema/projectMembers';
import { db } from "@/db/index";
import { eq, and } from 'drizzle-orm';
import { ForbiddenError } from "@/utils/errors";

export async function requireMembership(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  const projectId = req.params.id;
  const userId = req.userId;

  const result = await db
    .select({ role: projectMemberTable.role })
    .from(projectMemberTable)
    .where(and(eq(projectMemberTable.userId, userId), eq(projectMemberTable.projectId, projectId)));


  const membership = result[0];

  if (!membership) {
    throw new ForbiddenError();
  }

  req.membership = { role: membership.role, projectId };

  next();
};
