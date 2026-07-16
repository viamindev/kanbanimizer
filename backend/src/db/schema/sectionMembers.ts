import { foreignKey, index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core"
import { projectMemberTable } from './projectMembers'
import { sectionsTable } from "./sections"
import { usersTable } from "./users"

export const sectionMembersTable = pgTable(
  "section_members",
  {
    projectId:
      uuid("project_id").
        notNull(),

    sectionId:
      uuid("section_id").
        notNull(),

    userId:
      uuid("user_id").
        notNull(),

    grantedByUserId:
      uuid("granted_by_user_id").
        references(() => usersTable.id, {
          onDelete: 'set null'
        }),

    grantedAt:
      timestamp('granted_at', { withTimezone: true, mode: 'date' }).
        defaultNow().
        notNull(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.projectId,
        table.sectionId,
        table.userId,
      ],
    }),

    foreignKey({
      name: "section_members_section_fk",
      columns: [
        table.projectId,
        table.sectionId,
      ],
      foreignColumns: [
        sectionsTable.projectId,
        sectionsTable.id,
      ],
    }).onDelete("cascade"),

    foreignKey({
      name: "section_members_project_member_fk",
      columns: [
        table.projectId,
        table.userId,
      ],
      foreignColumns: [
        projectMemberTable.projectId,
        projectMemberTable.userId,
      ],
    }).onDelete("cascade"),

    index("section_members_by_user_idx").on(
      table.projectId,
      table.userId,
      table.sectionId,
    ),
  ],
)