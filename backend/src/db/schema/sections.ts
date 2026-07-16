import { index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"
import { projectsTable } from "./projects"
import { usersTable } from "./users"

export const sectionAccessScopeEnum = pgEnum(
  "section_access_scope",
  ["project", "restricted"],
)

export const sectionsTable = pgTable("sections", {
  id:
    uuid('id').
      defaultRandom().
      primaryKey(),

  projectId:
    uuid('project_id').
      notNull().
      references(() => projectsTable.id,
        { onDelete: 'cascade' }),

  createdByUserId:
    uuid('created_by_user_id').
      notNull().
      references(() => usersTable.id,
        { onDelete: 'set null' }),

  name:
    text('name').
      notNull(),

  description:
    text("description"),

  accessScope:
    sectionAccessScopeEnum("access_scope").
      default("project").
      notNull(),

  position:
    integer("position").
      default(0).
      notNull(),

  createdAt:
    timestamp('created_at',
      { withTimezone: true, mode: 'date' }).
      defaultNow().
      notNull(),

  updatedAt:
    timestamp('updated_at',
      { withTimezone: true, mode: 'date' }).
      defaultNow().
      notNull().
      $onUpdate(() => new Date()),
},


  (table) => [
    unique("section_project_id_id_uq").on(
      table.projectId,
      table.id
    ),

    index("sections_project_position_idx").on(
      table.projectId,
      table.position
    )
  ])
