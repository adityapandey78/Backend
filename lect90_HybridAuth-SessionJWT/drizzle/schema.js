import { relations } from 'drizzle-orm';
import { mysqlTable, serial, timestamp, varchar, int } from 'drizzle-orm/mysql-core';

// Define users table first
export const usersTable = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Define short_links table after users table
export const short_links = mysqlTable('short_links', {
  id: serial('id').primaryKey(),
  shortCode: varchar('shortCode', { length: 16 }).notNull().unique(),
  url: varchar('url', { length: 2048 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  userId:int("user_id").notNull().references(()=>usersTable.id),
});
/**
 * createdAt: timestamp("created_at").defaultNow().notNull(),
 * for this I have used "created_at" to target inside the mysql table coz we dont use camelcase there and createdAt to deal with the logic in js
 * same goes with updatedAt as well
 */

//? A user can have many shortlinks

export const usersRelation = relations(usersTable,({many})=>({
  shortLinks:many(short_links),
}))


//? A shortlink belongs to user

export const shortLinksrelations = relations(short_links,({one})=>({
  user: one(usersTable,{
    fields:[short_links.userId],//foreign key
    references:[usersTable.id], //aur kiske sath ref kr rhe hain
  })
}))