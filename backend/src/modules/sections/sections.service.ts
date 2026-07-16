import { db } from "@/db"
import { sectionMembersTable } from "@/db/schema/sectionMembers"
import { sectionsTable } from "@/db/schema/sections"
import { ProjectRole } from "@/utils/permissions"
import { and, asc, eq, isNotNull, max, or } from "drizzle-orm"


type SectionInputCreate = {
  projectId: string,
  createdBy: string,
  name: string,
  description?: string,
  visibility: "public" | "private",
}

type GetAllowedSectionsByProjectId = {
  projectId: string,
  userId: string,
  role: ProjectRole
}

type GetAllowedSectionById = {
  projectId: string,
  sectionId: string,
  userId: string,
  role: ProjectRole
}

const POSITION_STEP = 1000

export async function createSection({ projectId, createdBy, name, description, visibility }: SectionInputCreate) {
  const sectionId = crypto.randomUUID()

  //Search for max position value
  const [result] = await db.select({ maxPosition: max(sectionsTable.position) }).from(sectionsTable).where(eq(sectionsTable.projectId, projectId))
  const newPosition = (result?.maxPosition ?? 0) + POSITION_STEP
  const [section] = await db.insert(sectionsTable).values({ id: sectionId, projectId, createdBy, name, description, visibility, position: newPosition }).returning()

  return section
}

export async function getAllowedSectionsByProjectId({ projectId, userId, role }: GetAllowedSectionsByProjectId) {
  if (role === "owner") {
    return await db.select().from(sectionsTable).where(eq(sectionsTable.projectId, projectId)).orderBy(asc(sectionsTable.position))
  }
  const sections = await db
    .select()
    .from(sectionsTable)
    .leftJoin(
      sectionMembersTable,
      and(
        eq(sectionMembersTable.sectionId, sectionsTable.id),
        eq(sectionMembersTable.userId, userId),
      ),
    )
    .where(
      and(
        eq(sectionsTable.projectId, projectId),
        or(
          eq(sectionsTable.visibility, "public"),
          eq(sectionsTable.createdBy, userId),
          isNotNull(sectionMembersTable.id),
        ),
      ),
    )
    .orderBy(asc(sectionsTable.position))

  return sections.map((section) => section.sections)
}

export async function getAllowedSectionById({ projectId, sectionId, userId, role }: GetAllowedSectionById) {
  if (role === "owner") {
    const [section] = await db.select().from(sectionsTable).where(and(eq(sectionsTable.id, sectionId), eq(sectionsTable.projectId, projectId)))

    return section
  }

  const [section] = await db
    .select()
    .from(sectionsTable)
    .leftJoin(
      sectionMembersTable,
      and(
        eq(sectionMembersTable.sectionId, sectionsTable.id),
        eq(sectionMembersTable.userId, userId)
      )
    )
    .where(
      and(
        eq(sectionsTable.visibility, "public"),
        eq(sectionsTable.createdBy, userId),
        isNotNull(sectionMembersTable.id)
      )
    )

  return section?.sections
}

// export async function getSectionMembersById(sectionId: string) {
//   const assignedUsers = await db
//     .select({
//       id: usersTable.id,
//       username: usersTable.username,
//       role: sectionMembersTable.role
//     })
//     .from(sectionMembersTable)
// }
