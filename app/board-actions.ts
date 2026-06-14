"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  canWrite,
  requireBoardAccess,
  requireColumnAccess,
  requireTaskAccess,
} from "@/lib/access";
import { positionBetween } from "@/lib/position";
import { publish, type SerializedTask, type SerializedColumn } from "@/lib/events";

function serializeTask(t: {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: string;
  createdById: string | null;
}): SerializedTask {
  return {
    id: t.id,
    columnId: t.columnId,
    title: t.title,
    description: t.description,
    position: t.position,
    createdById: t.createdById,
  };
}

function serializeColumn(c: {
  id: string;
  boardId: string;
  name: string;
  position: string;
  createdById: string | null;
}): SerializedColumn {
  return {
    id: c.id,
    boardId: c.boardId,
    name: c.name,
    position: c.position,
    createdById: c.createdById,
  };
}

/* ----------------------------- board query ----------------------------- */

export async function getBoardData(boardId: string) {
  const user = await requireUser();
  const { board, membership } = await requireBoardAccess(boardId, user.id);
  const columns = await prisma.column.findMany({
    where: { boardId },
    orderBy: { position: "asc" },
    include: { tasks: { orderBy: { position: "asc" } } },
  });
  return {
    id: board.id,
    name: board.name,
    currentUserId: user.id,
    role: membership.role as "OWNER" | "ADMIN" | "MEMBER",
    columns: columns.map((c) => ({
      ...serializeColumn(c),
      tasks: c.tasks.map(serializeTask),
    })),
  };
}

/* ------------------------------- tasks --------------------------------- */

const createTaskSchema = z.object({
  columnId: z.string().uuid(),
  title: z.string().trim().min(1).max(300),
});

export async function createTaskAction(input: {
  columnId: string;
  title: string;
}): Promise<SerializedTask> {
  const user = await requireUser();
  const data = createTaskSchema.parse(input);
  const { boardId } = await requireColumnAccess(data.columnId, user.id);

  const last = await prisma.task.findFirst({
    where: { columnId: data.columnId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const position = positionBetween(last?.position ?? null, null);

  const task = await prisma.task.create({
    data: {
      columnId: data.columnId,
      title: data.title,
      position,
      createdById: user.id,
    },
  });
  const serialized = serializeTask(task);
  publish(boardId, { type: "task.created", task: serialized });
  return serialized;
}

const updateTaskSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().max(5000).nullable().optional(),
});

export async function updateTaskAction(input: {
  taskId: string;
  title?: string;
  description?: string | null;
}): Promise<SerializedTask> {
  const user = await requireUser();
  const data = updateTaskSchema.parse(input);
  const { boardId, task: existing, membership } = await requireTaskAccess(
    data.taskId,
    user.id,
  );
  if (!canWrite(membership.role, existing.createdById, user.id)) {
    throw new Error("FORBIDDEN");
  }

  const task = await prisma.task.update({
    where: { id: data.taskId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    },
  });
  const serialized = serializeTask(task);
  publish(boardId, { type: "task.updated", task: serialized });
  return serialized;
}

const moveTaskSchema = z.object({
  taskId: z.string().uuid(),
  columnId: z.string().uuid(),
  position: z.string().min(1).max(200),
});

export async function moveTaskAction(input: {
  taskId: string;
  columnId: string;
  position: string;
}): Promise<void> {
  const user = await requireUser();
  const data = moveTaskSchema.parse(input);
  const { boardId, task: existing, membership } = await requireTaskAccess(
    data.taskId,
    user.id,
  );
  if (!canWrite(membership.role, existing.createdById, user.id)) {
    throw new Error("FORBIDDEN");
  }
  // target column must live on the same board
  const { boardId: targetBoard } = await requireColumnAccess(
    data.columnId,
    user.id,
  );
  if (targetBoard !== boardId) throw new Error("CROSS_BOARD_MOVE");

  await prisma.task.update({
    where: { id: data.taskId },
    data: { columnId: data.columnId, position: data.position },
  });
  publish(boardId, {
    type: "task.moved",
    taskId: data.taskId,
    columnId: data.columnId,
    position: data.position,
  });
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  const user = await requireUser();
  const { boardId, task, membership } = await requireTaskAccess(taskId, user.id);
  if (!canWrite(membership.role, task.createdById, user.id)) {
    throw new Error("FORBIDDEN");
  }
  await prisma.task.delete({ where: { id: taskId } });
  publish(boardId, { type: "task.deleted", taskId });
}

/* ------------------------------ columns -------------------------------- */

const createColumnSchema = z.object({
  boardId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
});

export async function createColumnAction(input: {
  boardId: string;
  name: string;
}): Promise<SerializedColumn> {
  const user = await requireUser();
  const data = createColumnSchema.parse(input);
  await requireBoardAccess(data.boardId, user.id);

  const last = await prisma.column.findFirst({
    where: { boardId: data.boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const position = positionBetween(last?.position ?? null, null);

  const column = await prisma.column.create({
    data: {
      boardId: data.boardId,
      name: data.name,
      position,
      createdById: user.id,
    },
  });
  const serialized = serializeColumn(column);
  publish(data.boardId, { type: "column.created", column: serialized });
  return serialized;
}

const renameColumnSchema = z.object({
  columnId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
});

export async function renameColumnAction(input: {
  columnId: string;
  name: string;
}): Promise<SerializedColumn> {
  const user = await requireUser();
  const data = renameColumnSchema.parse(input);
  const { boardId, column: existing, membership } = await requireColumnAccess(
    data.columnId,
    user.id,
  );
  if (!canWrite(membership.role, existing.createdById, user.id)) {
    throw new Error("FORBIDDEN");
  }
  const column = await prisma.column.update({
    where: { id: data.columnId },
    data: { name: data.name },
  });
  const serialized = serializeColumn(column);
  publish(boardId, { type: "column.updated", column: serialized });
  return serialized;
}

const moveColumnSchema = z.object({
  columnId: z.string().uuid(),
  position: z.string().min(1).max(200),
});

export async function moveColumnAction(input: {
  columnId: string;
  position: string;
}): Promise<void> {
  const user = await requireUser();
  const data = moveColumnSchema.parse(input);
  const { boardId, column: existing, membership } = await requireColumnAccess(
    data.columnId,
    user.id,
  );
  if (!canWrite(membership.role, existing.createdById, user.id)) {
    throw new Error("FORBIDDEN");
  }
  await prisma.column.update({
    where: { id: data.columnId },
    data: { position: data.position },
  });
  publish(boardId, {
    type: "column.moved",
    columnId: data.columnId,
    position: data.position,
  });
}

export async function deleteColumnAction(columnId: string): Promise<void> {
  const user = await requireUser();
  const { boardId, column, membership } = await requireColumnAccess(
    columnId,
    user.id,
  );
  if (!canWrite(membership.role, column.createdById, user.id)) {
    throw new Error("FORBIDDEN");
  }
  await prisma.column.delete({ where: { id: columnId } });
  publish(boardId, { type: "column.deleted", columnId });
}
