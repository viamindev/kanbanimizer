import { db } from "@/db"
import { sectionMembersTable } from "@/db/schema/sectionMembers"
import { sectionsTable } from "@/db/schema/sections"
import { and, asc, eq, isNotNull, max, or } from "drizzle-orm"
import { projectsTable } from "@/db/schema/projects"


type SectionInputCreate = {
  projectId: string,
  createdByUserId: string,
  name: string,
  accessScope: "project" | "restricted";
  description?: string,
}

type AllowedSections = {
  projectId: string,
  userId: string
}

type DeleteSectionInput = {
  projectId: string,
  sectionId: string
}


const POSITION_STEP = 1000

export async function createSection({ projectId, createdByUserId, name, accessScope, description }: SectionInputCreate) {
  const [result] = await db.
    select({
      maxPosition: max(sectionsTable.position),
    })
    .from(sectionsTable)
    .where(eq(sectionsTable.projectId, projectId));

  const position = (result?.maxPosition ?? 0) + POSITION_STEP;

  const [section] = await db
    .insert(sectionsTable)
    .values({
      projectId,
      createdByUserId,
      name,
      accessScope,
      description,
      position
    })
    .returning();

  return section
}

// export async function getSectionById({ projectId, sectionId }: SectionInputGetById) {
//   const [section] = await db
//     .select()
//     .from(sectionsTable)
//     .where(
//       and(
//         eq(sectionsTable.projectId, projectId),
//         eq(sectionsTable.id, sectionId)))

//   return section;
// }

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
    .orderBy(asc(sectionsTable.position));

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
