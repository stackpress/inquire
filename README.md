# 💬 Inquire

[![NPM Package](https://img.shields.io/npm/v/@stackpress/inquire.svg?style=flat)](https://www.npmjs.com/package/@stackpress/inquire)
[![Tests Status](https://img.shields.io/github/actions/workflow/status/stackpress/inquire/test.yml)](https://github.com/stackpress/inquire/actions)
[![Coverage Status](https://coveralls.io/repos/github/stackpress/inquire/badge.svg?branch=main)](https://coveralls.io/github/stackpress/inquire?branch=main)
[![Commits](https://img.shields.io/github/last-commit/stackpress/inquire)](https://github.com/stackpress/inquire/commits/main/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat)](https://github.com/stackpress/inquire/blob/main/LICENSE)

Super lightweight generic typed SQL query builder, SQL dialects and composite engine. Schema builder, but no ORM. Bring your own database library.

## What is Inquire?

Inquire is a powerful yet lightweight SQL query builder that provides a unified interface for working with multiple database engines. Unlike traditional ORMs, Inquire focuses on query building and execution while letting you bring your own database connection library. This approach gives you the flexibility to use your preferred database driver while benefiting from a consistent, type-safe query building experience.

## Key Features

- **🪶 Lightweight**: No ORM overhead - just pure query building
- **🔧 Generic Typed**: Full TypeScript support with generic types for enhanced type safety
- **🗄️ Multi-Database**: Same expressive query builder pattern for all SQL engines
- **🔄 Unified Interface**: Consistent API across different database engines
- **📝 Schema Builder**: Create and modify database schemas programmatically
- **🔗 Template Strings**: Support for type-safe template string query building
- **⚡ Transaction Support**: Common transaction pattern across all engines
- **🎯 Dialect Agnostic**: Query builders work with any supported SQL dialect

## Supported Databases

Inquire supports a wide range of database engines through dedicated connection packages:

- **MySQL** - via `@stackpress/inquire-mysql2` (Node MySQL2)
- **PostgreSQL** - via `@stackpress/inquire-pg` (Node PostGres pg)
- **SQLite** - via `@stackpress/inquire-sqlite3` (Better SQLite3)
- **PGLite** - via `@stackpress/inquire-pglite` (PGLite)
- **CockroachDB** - Compatible with PostgreSQL adapter
- **NeonDB** - Compatible with PostgreSQL adapter
- **Vercel Postgres** - Compatible with PostgreSQL adapter
- **Supabase** - Compatible with PostgreSQL adapter

## Installation

Install the core library:

```bash
npm install @stackpress/inquire
```

Then install the appropriate database adapter:

```bash
# For MySQL
npm install @stackpress/inquire-mysql2 mysql2

# For PostgreSQL
npm install @stackpress/inquire-pg pg

# For SQLite
npm install @stackpress/inquire-sqlite3 better-sqlite3

# For PGLite
npm install @stackpress/inquire-pglite @electric-sql/pglite
```

## Quick Start

### MySQL Connection

```typescript
import mysql from 'mysql2/promise';
import connect from '@stackpress/inquire-mysql2';

// Create the raw database connection
const resource = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'inquire',
});

// Map the resource to the Inquire engine
const engine = connect(resource);
```

### PostgreSQL Connection

```typescript
import { Client, Pool } from 'pg';
import connect from '@stackpress/inquire-pg';

// Using a Pool
const pool = new Pool({
  database: 'inquire',
  user: 'postgres'
});
const connection = await pool.connect();

// Or using a Client
const client = new Client({
  database: 'inquire',
  user: 'postgres'
});
await client.connect();

// Map the resource to the Inquire engine
const engine = connect(connection); // or connect(client)
```

### SQLite Connection

```typescript
import sqlite from 'better-sqlite3';
import connect from '@stackpress/inquire-sqlite3';

// Create the raw database connection
const resource = sqlite(':memory:');

// Map the resource to the Inquire engine
const engine = connect(resource);
```

## Basic Usage

Once you have an engine instance, you can start building and executing queries:

```typescript
// Create a table
await engine.create('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('email', { type: 'VARCHAR', length: 255 })
  .addPrimaryKey('id');

// Insert data
await engine
  .insert('users')
  .values({ name: 'John Doe', email: 'john@example.com' });

// Select data
const users = await engine
  .select('*')
  .from('users')
  .where('name = ?', ['John Doe']);

console.log(users);

// Update data
await engine
  .update('users')
  .set({ email: 'john.doe@example.com' })
  .where('id = ?', [1]);

// Delete data
await engine
  .delete('users')
  .where('id = ?', [1]);
```

## Query Builders

Inquire provides comprehensive query builders for all common SQL operations:

- **[Create](./docs/builders/Create.md)** - Create tables and schemas
- **[Alter](./docs/builders/Alter.md)** - Modify existing tables
- **[Select](./docs/builders/Select.md)** - Query data with joins, conditions, and aggregations
- **[Insert](./docs/builders/Insert.md)** - Insert single or multiple records
- **[Update](./docs/builders/Update.md)** - Update existing records
- **[Delete](./docs/builders/Delete.md)** - Delete records with conditions

## Template String Queries

For complex queries, you can use type-safe template strings:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
};

const userId = 123;
const results = await engine.sql<User>`
  SELECT u.*, p.title 
  FROM users u 
  LEFT JOIN posts p ON u.id = p.user_id 
  WHERE u.id = ${userId}
`;
// results is typed as User[]
```

## Transactions

Execute multiple queries in a transaction:

```typescript
const result = await engine.transaction(async (trx) => {
  await trx.insert('users').values({ name: 'Alice' });
  await trx.insert('posts').values({ title: 'Hello World', user_id: 1 });
  return 'success';
});
```

## Type Safety

Inquire is designed with TypeScript in mind, providing full type safety:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
};

// Type-safe queries
const users = await engine.select<User>('*').from('users');
// users is now typed as User[]

const user = await engine.select<User>('*')
  .from('users')
  .where('id = ?', [1])
  .limit(1);
// user is typed as User[]
```

## API Documentation

For detailed API documentation, see:

- **[Engine](./docs/Engine.md)** - Core engine class and methods
- **[Connection Classes](./docs/Connections.md)** - Database-specific connection implementations
- **[Query Builders](./docs/builders/README.md)** - Detailed documentation for all query builders
- **[SQL Dialects](./docs/dialects/README.md)** - Detailed documentation for all SQL dialects
- **[Examples](./docs/Examples.md)** - Comprehensive usage examples

## Examples

Check out the [examples directory](./examples) for complete working examples with different database engines:

- [MySQL Example](./examples/with-mysql2)
- [PostgreSQL Example](./examples/with-pg)
- [SQLite Example](./examples/with-sqlite3)
- [PGLite Example](./examples/with-pglite)
