import { pgTable, varchar, uuid, timestamp} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const refreshTokensTable = pgTable("refresh_tokens", {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export type RefreshToken = typeof refreshTokensTable.$inferSelect;
export type NewRefreshToken = typeof refreshTokensTable.$inferInsert;