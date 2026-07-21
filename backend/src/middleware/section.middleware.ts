import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { sectionsTable } from "@/db/schema/sections";
import { ForbiddenError, NotFoundError, UnauthorizedError, } from "@/utils/errors";
import { sectionMembersTable } from "@/db/schema/sectionMembers";
import { can, type Action } from "@/utils/permissions";



type SectionParams = {
  projectId: string;
  sectionId: string;
};

export async function loadSection(
  req: Request<SectionParams>,
  _res: Response,
  next: NextFunction,
) {
  const { projectId, sectionId } = req.params;

  const [section] = await db
    .select()
    .from(sectionsTable)
    .where(
      and(
        eq(sectionsTable.id, sectionId),
        eq(sectionsTable.projectId, projectId),
      ),
    );

  if (!section) {
    throw new NotFoundError("Section not found");
  }

  req.section = section;

  next();
}

export async function requireSectionAccess(
  req: Request<SectionParams>,
  _res: Response,
  next: NextFunction,
) {
  const userId = req.user?.id;
  const membership = req.membership;
  const section = req.section;

  if (!userId) {
    throw new UnauthorizedError();
  }

  if (!membership) {
    throw new ForbiddenError();
  }

  if (!section) {
    throw new NotFoundError("Section not found");
  }

  if (
    membership.projectId !== section.projectId
  ) {
    throw new NotFoundError("Section not found");
  }

  if (membership.role === "owner") {
    return next();
  }

  if (section.accessScope === "project") {
    return next();
  }

  if (section.createdByUserId === userId) {
    return next();
  }

  const [sectionMembership] = await db
    .select({
      userId: sectionMembersTable.userId,
    })
    .from(sectionMembersTable)
    .where(
      and(
        eq(
          sectionMembersTable.projectId,
          section.projectId,
        ),
        eq(
          sectionMembersTable.sectionId,
          section.id,
        ),
        eq(sectionMembersTable.userId, userId),
      ),
    )
    .limit(1);

  if (!sectionMembership) {
    throw new NotFoundError("Section not found");
  }

  next();
}


export function requireSectionPermission(
  action: Action,
) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    const userId = req.user?.id;
    const membership = req.membership;
    const section = req.section;

    if (!userId) {
      throw new UnauthorizedError();
    }

    if (!membership) {
      throw new ForbiddenError();
    }

    if (!section) {
      throw new NotFoundError("Section not found");
    }

    const allowed = can(
      membership.role,
      action,
      {
        userId,
        resourceCreatedBy:
          section.createdByUserId,
      },
    );

    if (!allowed) {
      throw new ForbiddenError();
    }

    next();
  };
}
