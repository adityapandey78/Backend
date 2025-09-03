# Prisma ORM - Complete Guide

## What is Prisma ORM?

Prisma is a modern database toolkit that consists of:
- **Prisma Client**: Auto-generated query builder for TypeScript & JavaScript
- **Prisma Migrate**: Database migration system
- **Prisma Studio**: Visual database browser

## Installation & Setup

```bash
npm install prisma @prisma/client
npx prisma init
```

## Schema Definition

```prisma
// prisma/schema.prisma
generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}

model User {
    id    Int     @id @default(autoincrement())
    email String  @unique
    name  String?
    posts Post[]
}

model Post {
    id        Int     @id @default(autoincrement())
    title     String
    content   String?
    published Boolean @default(false)
    authorId  Int
    author    User    @relation(fields: [authorId], references: [id])
}
```

## CRUD Operations

### Create Operations

```javascript
// Single record
const user = await prisma.user.create({
    data: {
        email: 'john@example.com',
        name: 'John Doe'
    }
})

// With relations
const userWithPost = await prisma.user.create({
    data: {
        email: 'jane@example.com',
        name: 'Jane Doe',
        posts: {
            create: [
                { title: 'My First Post', content: 'Hello World!' }
            ]
        }
    }
})

// Multiple records
const users = await prisma.user.createMany({
    data: [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' }
    ]
})
```

### Read Operations

```javascript
// Find all
const users = await prisma.user.findMany()

// Find with conditions
const publishedPosts = await prisma.post.findMany({
    where: { published: true },
    include: { author: true }
})

// Find unique
const user = await prisma.user.findUnique({
    where: { email: 'john@example.com' }
})

// Find first
const firstUser = await prisma.user.findFirst({
    orderBy: { id: 'desc' }
})

// Pagination
const users = await prisma.user.findMany({
    skip: 10,
    take: 5
})
```

### Update Operations

```javascript
// Update single
const updatedUser = await prisma.user.update({
    where: { id: 1 },
    data: { name: 'Updated Name' }
})

// Update many
const result = await prisma.post.updateMany({
    where: { published: false },
    data: { published: true }
})

// Upsert (update or create)
const user = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: { name: 'John Updated' },
    create: { email: 'john@example.com', name: 'John New' }
})
```

### Delete Operations

```javascript
// Delete single
const deletedUser = await prisma.user.delete({
    where: { id: 1 }
})

// Delete many
const result = await prisma.post.deleteMany({
    where: { published: false }
})
```

## Advanced Queries

### Filtering & Sorting

```javascript
// Complex filtering
const users = await prisma.user.findMany({
    where: {
        OR: [
            { name: { contains: 'John' } },
            { email: { endsWith: '@gmail.com' } }
        ],
        posts: {
            some: { published: true }
        }
    },
    orderBy: [
        { name: 'asc' },
        { id: 'desc' }
    ]
})
```

### Aggregations

```javascript
const stats = await prisma.post.aggregate({
    _count: { id: true },
    _avg: { authorId: true },
    _sum: { authorId: true },
    _min: { id: true },
    _max: { id: true }
})

const groupedPosts = await prisma.post.groupBy({
    by: ['authorId'],
    _count: { id: true },
    having: {
        id: { _count: { gt: 5 } }
    }
})
```

## Migrations

### What are Migrations?

Migrations are version-controlled changes to your database schema that allow you to:
- Update database structure safely
- Share schema changes with team members
- Deploy changes to production environments

### Migration Commands

```bash
# Create and apply migration
npx prisma migrate dev --name add_user_table

# Apply pending migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Migration Example

```sql
-- Migration file: 001_add_user_table.sql
CREATE TABLE "User" (
        "id" SERIAL NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
```

## Transactions

```javascript
// Sequential transaction
const result = await prisma.$transaction([
    prisma.user.create({ data: { email: 'user1@example.com' } }),
    prisma.post.create({ data: { title: 'Post 1', authorId: 1 } })
])

// Interactive transaction
const transfer = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
        where: { id: 1 },
        data: { balance: { decrement: 100 } }
    })
    
    return tx.user.update({
        where: { id: 2 },
        data: { balance: { increment: 100 } }
    })
})
```

## Important Interview Questions

### 1. What is Prisma ORM and its key components?
**Answer**: Prisma is a modern database toolkit consisting of Prisma Client (type-safe query builder), Prisma Migrate (migration system), and Prisma Studio (database GUI).

### 2. Explain Prisma Schema and its purpose
**Answer**: Prisma Schema is a declarative configuration file that defines database connection, models, and generates the Prisma Client. It serves as the single source of truth for database structure.

### 3. What's the difference between `findUnique` and `findFirst`?
**Answer**: `findUnique` requires unique fields and returns null if not found. `findFirst` returns the first record matching criteria or null, doesn't require unique fields.

### 4. How do you handle database migrations in Prisma?
**Answer**: Use `prisma migrate dev` for development, `prisma migrate deploy` for production. Migrations are SQL files that version control database schema changes.

### 5. What are Prisma transactions and when to use them?
**Answer**: Transactions ensure multiple database operations succeed or fail together. Use for operations that must maintain data consistency (e.g., financial transfers).

### 6. Explain the difference between `include` and `select`
**Answer**: `include` adds related data to the result while keeping all fields. `select` returns only specified fields and relations.

### 7. How does Prisma handle connection pooling?
**Answer**: Prisma Client manages connection pooling automatically. Can be configured via connection string parameters for optimization.

### 8. What is the N+1 problem and how does Prisma solve it?
**Answer**: N+1 occurs when making multiple queries for related data. Prisma solves this with `include` and `select` to fetch related data in a single query.

### 9. How do you handle database seeding in Prisma?
**Answer**: Create a `seed.ts` file and configure it in `package.json`. Run with `npx prisma db seed`.

### 10. What are Prisma middlewares?
**Answer**: Functions that intercept and modify Prisma Client queries. Used for logging, authentication, data transformation, etc.

## Best Practices

1. **Always use transactions** for related operations
2. **Use select/include wisely** to avoid over-fetching
3. **Handle errors properly** with try-catch blocks
4. **Use connection pooling** in production
5. **Keep migrations small** and atomic
6. **Use database indexes** for frequently queried fields
7. **Validate data** before database operations
8. **Use environment variables** for database URLs

## Common Patterns

```javascript
// Repository pattern
class UserRepository {
    async findById(id) {
        return prisma.user.findUnique({ where: { id } })
    }
    
    async create(userData) {
        return prisma.user.create({ data: userData })
    }
}

// Error handling
try {
    const user = await prisma.user.create({ data: userData })
} catch (error) {
    if (error.code === 'P2002') {
        throw new Error('User already exists')
    }
    throw error
}
```