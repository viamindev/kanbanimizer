import { db } from "@/db/index"
import { projectMemberTable } from '@/db/schema/projectMembers'
import { projectsTable } from '@/db/schema/projects'
import { usersTable } from '@/db/schema/users'
import { eq, sql } from 'drizzle-orm'

type createProjectInput = {
  name: string;
  description?: string | null;
  ownerUserId: string;
};

type updateProjectInput = {
  name?: string;
  description?: string | null;
}

export async function createProject({ ownerUserId, name, description }: createProjectInput) {
  const [project] = await db.
    insert(projectsTable).
    values({ ownerUserId, name, description }).
    returning();

  return project;
}

export async function getOwnedProjectsByUserId(userId: string) {
  const userProjects = await db.
    select().
    from(projectsTable).
    where(eq(projectsTable.ownerUserId, userId));

  return userProjects
}

export async function getProjectById(projectId: string) {
  const [project] = await db.
    select().
    from(projectsTable).
    where(eq(projectsTable.id, projectId));

  return project;
}

export async function updateProject(projectId: string, input: updateProjectInput) {
  const [updatedProject] = await db.
    update(projectsTable).
    set(input).
    where(
      eq(projectsTable.id, projectId)).
    returning()

  return updatedProject;
}

export async function deleteProject(projectId: string) {
  const [deletedProject] = await db.
    delete(projectsTable).
    where(eq(projectsTable.id, projectId)).
    returning();

  return deletedProject
}

export async function getProjectMembersById(projectId: string) {
  const [ownerRows, members] = await db.batch([
    db.select({
      id: usersTable.id,
      username: usersTable.username,
      role: sql<"owner">`'owner'`.as("role"),
    }).from(projectsTable).
      innerJoin(usersTable, eq(usersTable.id, projectsTable.ownerUserId),).
      where(eq(projectsTable.id, projectId))
      .limit(1),

    db.select({
      id: usersTable.id,
      username: usersTable.username,
      role: projectMemberTable.role,
    }).from(projectMemberTable).
      innerJoin(usersTable, eq(usersTable.id, projectMemberTable.userId),
      ).where(eq(projectMemberTable.projectId, projectId))
  ]);

  const owner = ownerRows[0];

  if (!owner) return []

  return [owner, ...members]
}
