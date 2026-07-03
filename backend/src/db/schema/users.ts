import { pgTable, varchar, uuid, timestamp, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    username: varchar('username', { length: 80 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date())
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;