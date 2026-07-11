import { sectionsTable } from "@/db/schema/sections";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";


type SectionInputCreate = {
  projectId: string,
  createdBy: string,
  name: string,
  description?: string,
  visibility: "public" | "private",
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
