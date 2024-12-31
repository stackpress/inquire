# Quick Start Guide

This guide will help you get up and running with Inquire quickly.

## Basic Setup

1. Install the required packages:

```bash
npm install @stackpress/inquire @stackpress/inquire-pg
```

2. Create a database connection:

```typescript
import { createInquire } from '@stackpress/inquire';
import { PostgresAdapter } from '@stackpress/inquire-pg';

const db = createInquire({
  adapter: new PostgresAdapter({
    host: 'localhost',
    database: 'myapp'
  })
});
```

## Define Your Types

Define TypeScript interfaces for your database tables:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  published: boolean;
  created_at: Date;
}
```

## Basic Queries

### Select Query

```typescript
// Select all users
const users = await db
  .select<User>()
  .from('users')
  .execute();

// Select with conditions
const activeUsers = await db
  .select<User>()
  .from('users')
  .where('active', '=', true)
  .execute();

// Select specific columns
const userEmails = await db
  .select<Pick<User, 'id' | 'email'>>(['id', 'email'])
  .from('users')
  .execute();
```

### Insert Query

```typescript
// Insert a single user
const newUser = await db
  .insertInto('users')
  .values({
    name: 'John Doe',
    email: 'john@example.com'
  })
  .returning<User>('*')
  .execute();

// Bulk insert
const newUsers = await db
  .insertInto('users')
  .values([
    { name: 'John', email: 'john@example.com' },
    { name: 'Jane', email: 'jane@example.com' }
  ])
  .returning<User>('*')
  .execute();
```

### Update Query

```typescript
// Update users
const updatedCount = await db
  .update('users')
  .set({ active: true })
  .where('email', 'like', '%@example.com')
  .execute();
```

### Delete Query

```typescript
// Delete users
const deletedCount = await db
  .deleteFrom('users')
  .where('active', '=', false)
  .execute();
```

### Joins

```typescript
// Join users and posts
const userPosts = await db
  .select(['users.name', 'posts.title'])
  .from('users')
  .leftJoin('posts', 'users.id', '=', 'posts.user_id')
  .where('posts.published', '=', true)
  .execute();
```

## Using Transactions

```typescript
await db.transaction(async (trx) => {
  // All queries within this callback use the same transaction
  const user = await trx
    .insertInto('users')
    .values({ name: 'John', email: 'john@example.com' })
    .returning<User>('*')
    .execute();

  await trx
    .insertInto('posts')
    .values({
      user_id: user.id,
      title: 'My First Post',
      content: 'Hello World!'
    })
    .execute();
});
```

## Next Steps

- Learn more about [Query Building](/guide/query-building)
- Understand [Type Safety](/guide/type-safety)
- Explore [Database Adapters](/guide/adapters)
