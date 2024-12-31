# Getting Started with Inquire

Welcome to the Inquire documentation! This guide will help you get started with using Inquire in your projects.

## What is Inquire?

Inquire is a TypeScript-first SQL query builder that focuses on:

- Type safety
- Developer experience
- Database agnostic design
- Modern JavaScript practices

## Prerequisites

Before you begin, make sure you have:

- Node.js (version 14 or higher)
- npm or yarn package manager
- Basic understanding of SQL and TypeScript

## Installation

1. Install the core package:

```bash
npm install @stackpress/inquire
```

2. Install your preferred database adapter:

```bash
# For PostgreSQL
npm install @stackpress/inquire-pg

# For MySQL
npm install @stackpress/inquire-mysql2

# For SQLite3
npm install @stackpress/inquire-sqlite3
```

## Basic Usage

Here's a simple example to get you started:

```typescript
import { createInquire } from '@stackpress/inquire';
import { PostgresAdapter } from '@stackpress/inquire-pg';

// Define your table structure
interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

// Create a database connection
const db = createInquire({
  adapter: new PostgresAdapter({
    host: 'localhost',
    database: 'myapp'
  })
});

// Execute a type-safe query
const users = await db
  .select<User>()
  .from('users')
  .where('created_at', '>', new Date('2024-01-01'))
  .orderBy('created_at', 'desc')
  .execute();
```

## Next Steps

- Learn about [Query Building](/guide/query-building)
- Understand [Type Safety](/guide/type-safety)
- Explore different [Database Adapters](/guide/adapters)
