import "server-only";
import { prisma } from "@/lib/prisma";

export type Role = "OWNER" | "ADMIN" | "MEMBER";

/**
 * Write permission rule:
 * OWNER/ADMIN may modify/delete any entity in the project;
 * a MEMBER may modify/delete only entities they created.
 */
export function canWrite(
  role: Role,
  creatorId: string | null,
  userId: string,
): boolean {
  return role === "OWNER" || role === "ADMIN" || creatorId === userId;
}

/** Throws unless the user is an active member of the project. Returns membership. */
export async function requireProjectMember(projectId: string, userId: string) {
  const membership = await prisma.membership.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership || membership.revokedAt) throw new Error("FORBIDDEN");
  return membership;
}

/**
 * Resolve a board and verify the user can access it (member of its project).
 * Returns the board, projectId, and the caller's membership.
 * NOTE: subproject-level access (SubprojectAccess) is not enforced in the MVP.
 */
export async function requireBoardAccess(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { subproject: { select: { projectId: true } } },
  });
  if (!board) throw new Error("NOT_FOUND");
  const membership = await requireProjectMember(
    board.subproject.projectId,
    userId,
  );
  return { board, projectId: board.subproject.projectId, membership };
}

/** Resolve the project that owns a column and verify access. */
export async function requireColumnAccess(columnId: string, userId: string) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { board: { include: { subproject: { select: { projectId: true } } } } },
  });
  if (!column) throw new Error("NOT_FOUND");
  const membership = await requireProjectMember(
    column.board.subproject.projectId,
    userId,
  );
  return { column, boardId: column.boardId, membership };
}

/** Resolve the board a task lives on and verify access. */
export async function requireTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      column: {
        include: {
          board: { include: { subproject: { select: { projectId: true } } } },
        },
      },
    },
  });
  if (!task) throw new Error("NOT_FOUND");
  const membership = await requireProjectMember(
    task.column.board.subproject.projectId,
    userId,
  );
  return { task, boardId: task.column.boardId, membership };
}
