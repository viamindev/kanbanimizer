import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export class UnauthorizedError extends Error {
    constructor() {
        super("Unauthorized")
        this.name = "Unauthorized"
    }
}

export async function getCurrentUser() {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new UnauthorizedError()
    return session.user
}