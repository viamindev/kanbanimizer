import { projectsTable } from '@/db/schema/projects';
import { db } from "@/db/index";
import { and, eq } from 'drizzle-orm';
import { projectMemberTable } from '@/db/schema/projectMembers';
import crypto from "crypto";


type ProjectInput = {
  name: string;
  description?: string | null;
  ownerId: string;
};

type ProjectInputUpdate = {
  name?: string;
  description?: string | null;
}

export async function createProject({ name, description, ownerId }: ProjectInput) {
  const projectId = crypto.randomUUID();

  const [[project]] = await db.batch([
    db.insert(projectsTable).values({ id: projectId, name, description, ownerId }).returning(),
    db.insert(projectMemberTable).values({ projectId, userId: ownerId, role: "owner" }),
  ]);
  return project;
}

export async function getProjectsByUserId(userId: string) {
  const result = await db.select().from(projectsTable).where(eq(projectsTable.ownerId, userId));
  return result;
}

export async function getProjectById(projectId: string, userId: string) {
  const result = await db.select().from(projectsTable).where(and(eq(projectsTable.id, projectId), eq(projectsTable.ownerId, userId)))
  return result[0];
}

export async function updateProject(projectId: string, project: ProjectInputUpdate, userId: string) {
  const result = await db.update(projectsTable).set(project).where(and(eq(projectsTable.id, projectId), eq(projectsTable.ownerId, userId))).returning();
  return result[0];
}

export async function deleteProject(projectId: string, userId: string) {
  const result = await db.delete(projectsTable).where(and(eq(projectsTable.id, projectId), eq(projectsTable.ownerId, userId))).returning();
  return result[0];
}
