import { getCurrentUser, UnauthorizedError } from "@/lib/session"
import { NextResponse } from "next/server";
import { z } from "zod"
import prisma from "@/lib/prisma";

const updateProjectSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional()
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getCurrentUser();
        const { id } = await params;
        const body = await req.json();

        const member = await prisma.projectMember.findFirst({
            where: { projectId: id, userId: user.id }
        })

        if (!member) return NextResponse.json({ error: "Нет доступа к проекту" }, { status: 403 });
        if (member.role !== "OWNER") return NextResponse.json({ error: "Нет прав для редактирования" }, { status: 403 });

        const parsed = updateProjectSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: z.flattenError(parsed.error).fieldErrors }, { status: 400 }
            )
        }

        const { name, description } = parsed.data;

        const project = await prisma.project.update({
            where: {
                id: id
            },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description })
            }
        })

        return NextResponse.json(project, { status: 200 })
    } catch (e) {
        if (e instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
        }
        return NextResponse.json({ error: "Ошибка сервера при изменении проекта" }, { status: 500 })
    }
}