import { index, pgEnum, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core"
import { projectsTable } from "./projects"
import { usersTable } from "./users"

export const projectRoleEnum = pgEnum("project_role", ["member", "viewer"])

export const projectMemberTable = pgTable("project_members", {
  projectId:
    uuid('project_id').
      notNull().
      references(() => projectsTable.id,
        { onDelete: 'cascade' }),

  userId:
    uuid('user_id').
      notNull().
      references(() => usersTable.id,
        { onDelete: 'cascade' }),

  role:
    projectRoleEnum('role').
      default('member').
      notNull(),

  joinedAt:
    timestamp('joined_at',
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
  (table => [
    primaryKey({
      columns: [table.projectId, table.userId]
    }),
    index("project_members_by_user_idx").on(
      table.userId,
      table.projectId
    )
  ]))

export type ProjectMembers = typeof projectMemberTable.$inferSelect
export type NewProjectMembers = typeof projectMemberTable.$inferInsert
