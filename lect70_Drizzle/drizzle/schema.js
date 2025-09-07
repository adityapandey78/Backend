import { mysqlTable, serial, timestamp, varchar, int } from 'drizzle-orm/mysql-core';


export const short_links = mysqlTable('short_links', {
  id: serial('id').primaryKey(),
  shortCode: varchar('shortCode', { length: 16 }).notNull().unique(),
  url: varchar('url', { length: 2048 }).notNull(),
});

export const usersTable = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
/**
 * createdAt: timestamp("created_at").defaultNow().notNull(),
 * for this I have used "created_at" to target inside the mysql table coz we dont use camelcase there and createdAt to deal with the logic in js
 * same goes with updatedAt as well
 */