import { NextResponse } from "next/server";
import { z } from "zod"
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(8, "Минимум 8 символов для пароля"),
    name: z.string().min(4, "Минимум 4 символа для имени").max(20, "Максимум 20 символов для имени")
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const parsed = registerSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: z.flattenError(parsed.error).fieldErrors },
                { status: 400 }
            )
        }

        const { email, password, name } = parsed.data;

        const isExisting = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (isExisting) return NextResponse.json({ error: "Такой email уже существует" }, { status: 409 })

        const hashed = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, name, password: hashed },
            select: { id: true, email: true, name: true }
        })

        return NextResponse.json(user, { status: 201 })
    } catch {
        return NextResponse.json({ error: "Ошибка сервера при регистрации" }, { status: 500 })
    }
}