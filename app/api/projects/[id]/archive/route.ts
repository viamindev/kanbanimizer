import { getCurrentUser, UnauthorizedError } from "@/lib/session"
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getCurrentUser();
        const { id } = await params;

        const member = await prisma.projectMember.findFirst({
            where: { projectId: id, userId: user.id }
        })

        if (!member) return NextResponse.json({ error: "Нет доступа к проекту" }, { status: 403 });
        if (member.role !== "OWNER") return NextResponse.json({ error: "Нет прав для удаления проекта" }, { status: 403 });

        const softDeleteProject = await prisma.project.update({
            where: {
                id: id
            },
            data: {
                deletedAt: new Date()
            }
        })

        return NextResponse.json(softDeleteProject, { status: 200 })

    } catch (e) {
        if (e instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
        }
        return NextResponse.json({ error: "Ошибка сервера при удалении проекта" }, { status: 500 })
    }
} 