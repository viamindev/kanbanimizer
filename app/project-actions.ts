"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { initialPositions } from "@/lib/position";

const DEFAULT_COLUMNS = ["Бэклог", "В работе", "Готово"];

const createSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(120),
});

export type ProjectFormState = { error?: string };

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ошибка ввода" };
  }

  const positions = initialPositions(DEFAULT_COLUMNS.length);

  const board = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: { name: parsed.data.name, ownerId: user.id },
    });
    await tx.membership.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: "OWNER",
        allSubprojects: true,
      },
    });
    const subproject = await tx.subproject.create({
      data: {
        projectId: project.id,
        name: "Основной",
        InvitationSubprojectId: "",
      },
    });
    const board = await tx.board.create({
      data: { subprojectId: subproject.id, name: "Доска" },
    });
    await tx.column.createMany({
      data: DEFAULT_COLUMNS.map((name, i) => ({
        boardId: board.id,
        name,
        position: positions[i],
      })),
    });
    return board;
  });

  redirect(`/board/${board.id}`);
}

/** Boards the user can reach, grouped under their projects. */
export async function listUserBoards(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId, revokedAt: null },
    include: {
      project: {
        include: {
          subprojects: { include: { boards: true } },
        },
      },
    },
  });

  return memberships.map((m) => ({
    projectId: m.project.id,
    projectName: m.project.name,
    role: m.role,
    boards: m.project.subprojects.flatMap((s) =>
      s.boards.map((b) => ({ id: b.id, name: b.name, subproject: s.name })),
    ),
  }));
}
