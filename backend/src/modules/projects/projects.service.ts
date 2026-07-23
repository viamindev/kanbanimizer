import { db } from "@/db/index"
import { projectMemberTable } from '@/db/schema/projectMembers'
import { projectsTable } from '@/db/schema/projects'
import { usersTable } from '@/db/schema/users'
import { eq, sql, or, isNotNull, and } from 'drizzle-orm'
import { ConflictError, NotFoundError } from "@/utils/errors";

type createProjectInput = {
  name: string;
  description?: string | null;
  ownerUserId: string;
};

type updateProjectInput = {
  name?: string;
  description?: string | null;
}

type AddProjectMemberInput = {
  projectId: string;
  ownerUserId: string;
  email: string;
  role: "member" | "viewer"
}

type RemoveProjectMemberInput = {
  projectId: string;
  memberUserId: string;
};

export async function createProject({ ownerUserId, name, description }: createProjectInput) {
  const [project] = await db.
    insert(projectsTable).
    values({ ownerUserId, name, description }).
    returning();

  return project;
}

export async function getAccessibleProjectsByUserId(
  userId: string,
) {
  return db
    .select({
      id: projectsTable.id,
      ownerUserId: projectsTable.ownerUserId,
      name: projectsTable.name,
      description: projectsTable.description,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
    })
    .from(projectsTable)
    .leftJoin(
      projectMemberTable,
      and(
        eq(
          projectMemberTable.projectId,
          projectsTable.id,
        ),
        eq(projectMemberTable.userId, userId),
      ),
    )
    .where(
      or(
        eq(projectsTable.ownerUserId, userId),
        isNotNull(projectMemberTable.userId),
      ),
    );
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

export async function addProjectMemberByEmail({
  projectId, ownerUserId, email, role
}: AddProjectMemberInput) {
  const [user] = await db.
    select({
      id: usersTable.id,
      email: usersTable.email,
      username: usersTable.username
    }).from(usersTable).where(eq(usersTable.email, email));

  if (!user) throw new NotFoundError("User with this email was not found");
  if (user.id === ownerUserId) throw new ConflictError("Project owner already has access");

  const [membership] = await db
    .insert(projectMemberTable)
    .values({
      projectId,
      userId: user.id,
      role
    })
    .onConflictDoNothing()
    .returning({ role: projectMemberTable.role, joinedAt: projectMemberTable.joinedAt })

  if (!membership) throw new ConflictError("User is already a project member");

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: membership.role,
    joinedAt: membership.joinedAt,
  }
}

export async function removeProjectMember({
  projectId,
  memberUserId,
}: RemoveProjectMemberInput) {
  const [deletedMembership] = await db
    .delete(projectMemberTable)
    .where(
      and(
        eq(projectMemberTable.projectId, projectId),
        eq(projectMemberTable.userId, memberUserId),
      ),
    )
    .returning({
      userId: projectMemberTable.userId,
      role: projectMemberTable.role,
    });

  return deletedMembership;
}
