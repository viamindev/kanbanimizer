import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AcceptInvite } from "@/components/accept-invite";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { project: { select: { name: true } } },
  });

  const user = await getCurrentUser();

  const valid =
    invite && invite.status === "PENDING" && invite.expiresAt > new Date();

  return (
    <main className="mx-auto mt-24 w-full max-w-md px-4">
      <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <h1 className="mb-2 text-xl font-heading">Приглашение в команду</h1>

        {!valid ? (
          <p className="text-sm text-foreground/70">
            Приглашение недействительно или истекло.
          </p>
        ) : !user ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Вас пригласили в проект{" "}
              <span className="font-heading">{invite.project.name}</span> (
              {invite.email}). Войдите или зарегистрируйтесь этим email, затем
              откройте ссылку снова.
            </p>
            <div className="flex gap-2">
              <Link href="/login" className="font-heading underline">
                Войти
              </Link>
              <Link href="/register" className="font-heading underline">
                Регистрация
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Присоединиться к проекту{" "}
              <span className="font-heading">{invite.project.name}</span> как{" "}
              {invite.email}?
            </p>
            <AcceptInvite token={token} />
          </div>
        )}
      </div>
    </main>
  );
}
