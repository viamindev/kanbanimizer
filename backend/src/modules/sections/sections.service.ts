import { db } from "@/db"
import { sectionMembersTable } from "@/db/schema/sectionMembers"
import { sectionsTable } from "@/db/schema/sections"
import { and, asc, eq, isNotNull, or } from "drizzle-orm"
import { projectsTable } from "@/db/schema/projects"
import { usersTable } from "@/db/schema/users"
import { projectMemberTable } from "@/db/schema/projectMembers"
import { ConflictError, NotFoundError } from "@/utils/errors"


type SectionInputCreate = {
  projectId: string,
  createdByUserId: string,
  name: string,
  accessScope: "project" | "restricted";
  description?: string | null,
}

type AllowedSections = {
  projectId: string,
  userId: string
}

type DeleteSectionInput = {
  projectId: string,
  sectionId: string
}

type UpdateSectionInput = {
  projectId: string;
  sectionId: string;
  input: {
    name?: string;
    description?: string | null;
    accessScope?: "project" | "restricted";
  };
};

type AddSectionMemberInput = {
  projectId: string;
  sectionId: string;
  grantedByUserId: string;
  email: string;
}


export async function createSection({
  projectId,
  createdByUserId,
  name,
  accessScope,
  description,
}: SectionInputCreate) {
  const [section] = await db
    .insert(sectionsTable)
    .values({
      projectId,
      createdByUserId,
      name,
      accessScope,
      description,
    })
    .returning();

  return section;
}

export async function getAllowedProjectSections({
  projectId,
  userId,
}: AllowedSections) {
  const rows = await db
    .select()
    .from(sectionsTable)
    .innerJoin(
      projectsTable,
      eq(projectsTable.id, sectionsTable.projectId),
    )
    .leftJoin(
      sectionMembersTable,
      and(
        eq(
          sectionMembersTable.projectId,
          sectionsTable.projectId,
        ),
        eq(
          sectionMembersTable.sectionId,
          sectionsTable.id,
        ),
        eq(sectionMembersTable.userId, userId),
      ),
    )
    .where(
      and(
        eq(sectionsTable.projectId, projectId),
        or(
          eq(projectsTable.ownerUserId, userId),
          eq(sectionsTable.accessScope, "project"),
          eq(sectionsTable.createdByUserId, userId),
          isNotNull(sectionMembersTable.userId),
        ),
      ),
    )
    .orderBy(asc(sectionsTable.createdAt));

  return rows.map((row) => row.sections);
}

export async function deleteSection({projectId, sectionId}: DeleteSectionInput) {
  const [deletedSection] = await db.
    delete(sectionsTable).
    where(
      and(eq(sectionsTable.projectId, projectId),eq(sectionsTable.id, sectionId))).
    returning();

  return deletedSection;
}

export async function updateSection({ projectId, sectionId, input }: UpdateSectionInput) {
  const [updatedSection] = await db.
    update(sectionsTable).
    set(input).
    where(
      and(eq(sectionsTable.projectId, projectId),eq(sectionsTable.id, sectionId))).returning()

  return updatedSection
}

export async function addSectionMemberByEmail({
  projectId, sectionId, grantedByUserId, email
}: AddSectionMemberInput) {
  const [projectMember] = await db
    .select({ id: usersTable.id, email: usersTable.email, username: usersTable.username, role: projectMemberTable.role })
    .from(projectMemberTable)
    .innerJoin(
      usersTable,
      eq(usersTable.id, projectMemberTable.userId)
    )
    .where(
      and(
        eq(projectMemberTable.projectId, projectId),
        eq(usersTable.email, email)
      )
    )

  if (!projectMember) throw new NotFoundError("User is not a member of this project");

  const [sectionMembership] = await db
    .insert(sectionMembersTable)
    .values({
      projectId,
      sectionId,
      userId: projectMember.id,
      grantedByUserId
    }).onConflictDoNothing()
    .returning({
      grantedAt: sectionMembersTable.grantedAt
    })

  if (!sectionMembership) throw new ConflictError("User already has access to this section");

  return {
    id: projectMember.id,
    email: projectMember.email,
    username: projectMember.username,
    role: projectMember.role,
    grantedAt: sectionMembership.grantedAt
  }
}
