import { projectsTable } from '@/db/schema/projects';
import { db } from "@/db/index";
import { and, eq } from 'drizzle-orm';

type ProjectInput = {
  name: string;
  description?: string | null;
  ownerId: string;
};

export async function createProject({ name, description, ownerId }: ProjectInput) {
  const result = await db.insert(projectsTable).values({ name, description, ownerId }).returning();
  return result[0];
}

export async function getProjectsByUserId(userId: string) {
  const result = await db.select().from(projectsTable).where(eq(projectsTable.ownerId, userId));
  return result;
}

export async function getProjectById(projectId: string) {
  const result = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  return result[0];
}

export async function updateProject(projectId: string, project: ProjectInput) {
  const result = await db.update(projectsTable).set(project).where(and(eq(projectsTable.id, projectId), eq(projectsTable.ownerId, project.ownerId))).returning();
  return result[0];
}

export async function deleteProject(projectId: string) {
  const result = await db.delete(projectsTable).where(eq(projectsTable.id, projectId)).returning();
  return result[0];
}
