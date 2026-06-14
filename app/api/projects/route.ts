// import { getCurrentUser, UnauthorizedError } from "@/lib/session"
// import { NextResponse } from "next/server";

// try {
//     const user = await getCurrentUser()
// } catch (error) {
//     if (error instanceof UnauthorizedError) {
//         return NextResponse.json({error: "Unauthorized"}, {status: 401})
//     } 
//     return NextResponse.json({error: "Ошибка"}, {status: 500})
// }