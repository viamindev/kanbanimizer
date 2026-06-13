import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { requireBoardAccess } from "@/lib/access";
import { getBoardData } from "@/app/board-actions";
import { BoardView } from "@/components/board/board-view";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let projectId: string;
  try {
    ({ projectId } = await requireBoardAccess(boardId, user.id));
  } catch {
    notFound();
  }

  const board = await getBoardData(boardId);
  const canInvite = board.role === "OWNER" || board.role === "ADMIN";

  return (
    <main className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b-2 border-border bg-secondary-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="font-heading underline">
            ← Проекты
          </Link>
          <h1 className="text-lg font-heading">{board.name}</h1>
        </div>
        <LogoutButton />
      </header>

      <BoardView
        boardId={boardId}
        projectId={projectId}
        canInvite={canInvite}
        currentUserId={board.currentUserId}
        role={board.role}
        initialColumns={board.columns}
      />
    </main>
  );
}
