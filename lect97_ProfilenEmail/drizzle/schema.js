import { relations, sql } from 'drizzle-orm';
import {boolean, mysqlTable, serial, timestamp, varchar, int,text } from 'drizzle-orm/mysql-core';

// Define users table first
export const usersTable = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  isEmailValid: boolean("is_email_valid").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Verify Email table
export const verifyEmailTokensTable = mysqlTable("is_email_valid", {
  id: int().autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: varchar({ length: 8 }).notNull(),
  expiresAt: timestamp("expires_at")
    // The brackets inside sql`` is necessary here, otherwise you would get syntax error.
    .default(sql`(CURRENT_TIMESTAMP + INTERVAL 1 DAY)`)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// Define short_links tab le after users table
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
//: A user can have many sessions as well

export const usersRelation = relations(usersTable,({many})=>({
  shortLinks:many(short_links),
  sessions:many(sessionsTable)// for the sesion table
}))


//? A shortlink belongs to user

export const shortLinksrelations = relations(short_links,({one})=>({
  user: one(usersTable,{
    fields:[short_links.userId],//foreign key
    references:[usersTable.id], //aur kiske sath ref kr rhe hain
  })
}))

//Schema for the session table -- auth storage on the server

export const sessionsTable=mysqlTable("sessions",{
  id:int().autoincrement().primaryKey(),
  userId:int("user_id").notNull()
                       .references(()=> usersTable.id,{onDelete: 'cascade'}),//cascade auto deletes the value of this user f the user get deleted form th original table
  valid:boolean().default(true).notNull(),
  userAgent:text("user_agent"),//!userAgent 
  ip:varchar({length:255}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),

})
/*
 * UserAgent is a header sent by a client's browser or applicatonn in an HTTP request. It provides info about the device, OS Broweser and version 
 */

//? Esthablishing a relation b/w the user and session

export const sessionRelation = relations(sessionsTable,({one})=>({
  user:one(usersTable,{
    fields:[sessionsTable.userId], //references
    references:[usersTable.id],
  })
}))


/**
 * 
 *: Why we need the fields and references in some relation?? 
Great question! This highlights a fundamental difference between one-to-many and many-to-one relationships in Drizzle ORM.

The Key Difference
The need for fields and references depends on where the foreign key lives:

usersRelation (one-to-many): The foreign key lives in the other table (short_links.userId)
shortLinksrelations (many-to-one): The foreign key lives in the current table (short_links.userId)

Why This Matters
1. Users Relation (One-to-Many)
Why no fields/references?

Drizzle automatically finds the foreign key in short_links table that points to usersTable
It looks for a column like short_links.userId that references usersTable.id
The relationship is inferred from the foreign key constraint
2. Short Links Relation (Many-to-One)
Why explicit fields/references?

You're defining the relationship from the table that owns the foreign key
Drizzle needs to know exactly which columns connect the tables
fields: "Which column(s) in MY table point to the other table?"
references: "Which column(s) in the OTHER table do I point to?"
Think of it This Way

*:The Rule of Thumb
Own the foreign key? → Specify fields and references
Don't own the foreign key? → Let Drizzle infer it automatically
 */