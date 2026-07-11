import { pgTable, timestamp, uuid, text, pgEnum, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

export const sectionVisibilityEnum = pgEnum(
  "section_visibility",
  ["public", "private"]
)

export const sectionsTable = pgTable("sections", {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text("description"),
  visibility: sectionVisibilityEnum("visibility").notNull().default("public"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
})
