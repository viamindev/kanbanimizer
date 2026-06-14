import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
    prisma?: PrismaClient;
};

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

//Если есть глобальный инстанс, то берем его, иначе создаем новый
const prisma = globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
    });

//Защита от ошибок при hotreload и создании кучи лишних инстансов
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma; 