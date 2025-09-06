import { mysqlTable, serial, varchar } from 'drizzle-orm/mysql-core';

export const short_links = mysqlTable('short_links', {
  id: serial('id').primaryKey(),
  shortCode: varchar('shortCode', { length: 16 }).notNull().unique(),
  url: varchar('url', { length: 2048 }).notNull(),
});
