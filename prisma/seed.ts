import { PrismaClient, Prisma } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter
});

export async function main() {
    const users = [
        { name: "Алиса", email: "alice@prisma.test", rawPassword: "12345678" },
        { name: "Толик", email: "tolik@prisma.test", rawPassword: "87654321" },
    ];

    for (const u of users) {
        const password = await bcrypt.hash(u.rawPassword, 10);

        await prisma.user.create({
            data: {
                name: u.name,
                email: u.email,
                password,
            },
        });
    }
}

main();