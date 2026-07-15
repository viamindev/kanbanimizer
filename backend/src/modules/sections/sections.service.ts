import { sectionsTable } from "@/db/schema/sections";
import { eq, max, and, asc, or, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { ProjectRole } from "@/utils/permissions";
import { sectionAccessTable } from "@/db/schema/sectionAccess";


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

const POSITION_STEP = 1000;

export async function createSection({ projectId, createdBy, name, description, visibility }: SectionInputCreate) {
  const sectionId = crypto.randomUUID();

  //Search for max position value
  const [result] = await db.select({maxPosition: max(sectionsTable.position)}).from(sectionsTable).where(eq(sectionsTable.projectId, projectId))
  const newPosition = (result?.maxPosition ?? 0) + POSITION_STEP;
  const [section] = await db.insert(sectionsTable).values({ id: sectionId, projectId, createdBy, name, description, visibility, position: newPosition }).returning();

  return section;
}

export async function getAllowedSectionsByProjectId({projectId, userId, role}: GetAllowedSectionsByProjectId) {
  if (role === "owner") {
    return await db.select().from(sectionsTable).where(eq(sectionsTable.projectId, projectId)).orderBy(asc(sectionsTable.position));
  }
  const sections = await db
    .select()
    .from(sectionsTable)
    .leftJoin(
      sectionAccessTable,
      and(
        eq(sectionAccessTable.sectionId, sectionsTable.id),
        eq(sectionAccessTable.userId, userId),
      ),
    )
    .where(
      and(
        eq(sectionsTable.projectId, projectId),
        or(
          eq(sectionsTable.visibility, "public"),
          eq(sectionsTable.createdBy, userId),
          isNotNull(sectionAccessTable.id),
        ),
      ),
    )
    .orderBy(asc(sectionsTable.position));

  return sections.map((section) => section.sections);
}

export async function getAllowedSectionById({projectId, sectionId, userId, role }:GetAllowedSectionById) {
  if (role === "owner") {
    const [section] = await db.select().from(sectionsTable).where(and(eq(sectionsTable.id, sectionId), eq(sectionsTable.projectId, projectId)));

    return section;
  }

  const [section] = await db
    .select()
    .from(sectionsTable)
    .leftJoin(
      sectionAccessTable,
      and(
        eq(sectionAccessTable.sectionId, sectionsTable.id),
        eq(sectionAccessTable.userId, userId)
      )
    )
    .where(
      and(
        eq(sectionsTable.visibility, "public"),
        eq(sectionsTable.createdBy, userId),
        isNotNull(sectionAccessTable.id)
      )
    )

  return section?.sections;
}
