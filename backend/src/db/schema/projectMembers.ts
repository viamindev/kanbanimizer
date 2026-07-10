import { pgEnum, pgTable, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

export const projectRoleEnum = pgEnum("project_role", ["owner", "member", "viewer"]);

export const projectMemberTable = pgTable("project_members", {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  role: projectRoleEnum('role').default('member').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
},
  (table => [
    unique().on(table.projectId, table.userId)
  ]));

export type ProjectMembers = typeof projectMemberTable.$inferSelect;
export type NewProjectMembers = typeof projectMemberTable.$inferInsert;
