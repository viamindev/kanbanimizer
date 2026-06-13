import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listUserBoards } from "@/app/project-actions";
import { CreateProjectForm } from "@/components/create-project-form";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projects = await listUserBoards(user.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading">Проекты</h1>
          <p className="text-sm text-foreground/70">{user.email}</p>
        </div>
        <LogoutButton />
      </header>

      <div className="mb-8 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow">
        <CreateProjectForm />
      </div>

      {projects.length === 0 ? (
        <p className="text-foreground/70">
          Пока нет проектов. Создайте первый — к нему сразу добавится доска с
          колонками.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {projects.map((p) => (
            <section key={p.projectId}>
              <h2 className="mb-2 text-lg font-heading">
                {p.projectName}{" "}
                <span className="text-xs font-base text-foreground/60">
                  {p.role}
                </span>
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {p.boards.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/board/${b.id}`}
                      className="block rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                    >
                      <div className="font-heading">{b.name}</div>
                      <div className="text-xs text-foreground/60">
                        {b.subproject}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
