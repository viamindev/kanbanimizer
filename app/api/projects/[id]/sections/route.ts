import { getCurrentUser, UnauthorizedError } from "@/lib/session"
import { NextResponse } from "next/server";
import { z } from "zod"
import prisma from "@/lib/prisma";

const createProjectSectionSchema = z.object({
    name: z.string().min(3, "Название секции обязательно").max(40, "Максимум 40 символов для ")
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getCurrentUser();
        const body = await req.json();
        const parsed = createProjectSectionSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: z.flattenError(parsed.error).fieldErrors },
                { status: 400 }
            )
        }

        const { id } = await params;

        const member = await prisma.projectMember.findFirst({
            where: { projectId: id, userId: user.id }
        });

        if (!member) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
        if (member.role !== "OWNER") return NextResponse.json({ error: "Нет прав" }, { status: 403 })

        const lastSection = await prisma.section.findFirst({
            where: { projectId: id },
            orderBy: { order: "desc" }
        })

        const newOrder = lastSection ? lastSection.order + 1 : 1;



        const { name } = parsed.data;

        const section = await prisma.section.create({
            data: {
                name,
                projectId: id,
                order: newOrder
            }
        })

        return NextResponse.json(section, { status: 201 })
    } catch (e) {
        if (e instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
        }
        return NextResponse.json({ error: "Ошибка сервера при создании проекта" }, { status: 500 })
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getCurrentUser();
        const { id } = await params;

        const member = await prisma.projectMember.findFirst({
            where: { projectId: id, userId: user.id }
        })

        if (!member) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

        const sections = await prisma.section.findMany({
            where: {
                projectId: id,
                deletedAt: null,
                ...(member.role === "MEMBER" && {
                    sectionAccesses: {
                        some: { projectMemberId: member.id }
                    }
                })
            },
            orderBy: { order: "asc" }
        })

        return NextResponse.json(sections, { status: 200 });
    } catch (e) {
        if (e instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
        }
        return NextResponse.json({ error: "Ошибка сервера при изменении проекта" }, { status: 500 })
    }
}