import { pgTable,timestamp,unique,uuid } from "drizzle-orm/pg-core";
import { sectionsTable } from "./sections";
import { usersTable } from "./users";

export const sectionAccessTable = pgTable(
  "section_access",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sectionId: uuid("section_id").notNull().references(() => sectionsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    grantedBy: uuid("granted_by").notNull().references(() => usersTable.id),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    unique().on(table.sectionId, table.userId)
  ]
)
