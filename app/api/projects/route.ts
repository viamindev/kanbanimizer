import { getCurrentUser, UnauthorizedError } from "@/lib/session"
import { NextResponse } from "next/server";
import { z } from "zod"
import prisma from "@/lib/prisma";

const createProjectSchema = z.object({
    name: z.string().min(1, "Название обязательно").max(100, "Максимум 100 символов"),
    description: z.string().optional()
});

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();

        const body = await req.json();
        const parsed = createProjectSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: z.flattenError(parsed.error).fieldErrors },
                { status: 400 }
            )
        }

        const { name, description } = parsed.data;

        const project = await prisma.$transaction(async (tx) => {
            const created = await tx.project.create({
                data: { name, description, ownerId: user.id }
            })

            await tx.projectMember.create({
                data: {
                    projectId: created.id,
                    userId: user.id,
                    role: "OWNER"
                }
            })

            return created
        })

        return NextResponse.json(project, { status: 201 })
    } catch (e) {
        if (e instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
        }
        return NextResponse.json({ error: "Ошибка сервера при создании проекта" }, { status: 500 })
    }
}

export async function GET() {
    try {
        const user = await getCurrentUser();

        const projects = await prisma.project.findMany({
            where: {
                projectMembers: { some: { userId: user.id } },
                deletedAt: null
            },
            orderBy: { createdAt: "desc" },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                projectMembers: {
                    where: { userId: user.id },
                    select: { role: true }
                },
                _count: {
                    select: { projectMembers: true, sections: true }
                }
            }
        })

        return NextResponse.json(projects, { status: 200 })
    } catch (e) {
        if (e instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
        }
        return NextResponse.json({ error: "Ошибка сервера при получении проектов" }, { status: 500 })
    }
}