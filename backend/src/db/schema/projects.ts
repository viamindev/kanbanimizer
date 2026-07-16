import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { usersTable } from "./users"

export const projectsTable = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "restrict",
      }),

    name:
      text("name").
        notNull(),

    description:
      text("description"),

    createdAt:
      timestamp("created_at", {
        withTimezone: true,
        mode: "date",
      }).
        defaultNow().
        notNull(),

    updatedAt:
      timestamp("updated_at",
        {
          withTimezone: true,
          mode: "date",
        }).
        defaultNow().
        notNull(),
  },
  (table) => [
    index("projects_owner_user_idx").on(table.ownerUserId),
  ],
)