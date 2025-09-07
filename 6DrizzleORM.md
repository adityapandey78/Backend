# Drizzle ORM - Complete Guide

## What is Drizzle ORM?
Drizzle ORM is a lightweight, type-safe JavaScript/TypeScript ORM designed for modern web applications. It provides compile-time safety and excellent performance.

## Key Features
- **Type Safety**: Full TypeScript support with compile-time type checking
- **Lightweight**: Minimal bundle size
- **SQL-like**: Close to raw SQL syntax
- **Database Agnostic**: Supports PostgreSQL, MySQL, SQLite

## Installation

```bash
# Install Drizzle ORM
npm install drizzle-orm

# Install database driver (example for PostgreSQL)
npm install pg

# Install Drizzle Kit for migrations
npm install -D drizzle-kit
```

## Database Connection Setup

### PostgreSQL Example
```javascript
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://user:password@localhost:5432/dbname'
});

const db = drizzle(pool);
```

## Schema Definition

```javascript
const { pgTable, serial, text, timestamp } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').unique().notNull(),
    createdAt: timestamp('created_at').defaultNow()
});

module.exports = { users };
```

## Basic Operations

### Insert
```javascript
await db.insert(users).values({
    name: 'John Doe',
    email: 'john@example.com'
});
```

### Select
```javascript
const { eq } = require('drizzle-orm');

const allUsers = await db.select().from(users);
const userById = await db.select().from(users).where(eq(users.id, 1));
```

### Update
```javascript
await db.update(users)
    .set({ name: 'Jane Doe' })
    .where(eq(users.id, 1));
```

### Delete
```javascript
await db.delete(users).where(eq(users.id, 1));
```

## Migration Setup

### drizzle.config.js
```javascript
module.exports = {
    schema: './src/schema.js',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL
    }
};
```

### Generate and Run Migrations
```bash
# Generate migration
npx drizzle-kit generate:pg

# Run migration
npx drizzle-kit push:pg
```

## Common Interview Questions

### 1. **What makes Drizzle ORM different from other ORMs?**
- Type-safe at compile time
- SQL-like syntax, closer to raw SQL
- Lightweight with better performance
- No runtime schema validation overhead

### 2. **How does Drizzle handle relationships?**
```javascript
const { integer } = require('drizzle-orm/pg-core');
const { eq } = require('drizzle-orm');

const posts = pgTable('posts', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    title: text('title').notNull()
});

// Query with joins
const usersWithPosts = await db
    .select()
    .from(users)
    .leftJoin(posts, eq(users.id, posts.userId));
```

### 3. **How to handle transactions?**
```javascript
await db.transaction(async (tx) => {
    await tx.insert(users).values({ name: 'John', email: 'john@test.com' });
    await tx.insert(posts).values({ userId: 1, title: 'First Post' });
});
```

### 4. **What are the advantages over Prisma?**
- Better performance (no query engine)
- Smaller bundle size
- More control over SQL queries
- No runtime dependencies

### 5. **How to implement pagination?**
```javascript
const page = 1;
const pageSize = 10;
const offset = (page - 1) * pageSize;

const paginatedUsers = await db
    .select()
    .from(users)
    .limit(pageSize)
    .offset(offset);
```

### 6. **How does query building work?**
Drizzle uses a fluent API that closely mirrors SQL:
```javascript
const { count, gt } = require('drizzle-orm');

const complexQuery = await db
    .select({
        userName: users.name,
        postCount: count(posts.id)
    })
    .from(users)
    .leftJoin(posts, eq(users.id, posts.userId))
    .where(gt(users.id, 5))
    .groupBy(users.id)
    .having(gt(count(posts.id), 0));
```

## Best Practices
- Define schemas in separate files
- Use transactions for related operations
- Implement proper error handling
- Use prepared statements for repeated queries
- Keep migrations in version control
