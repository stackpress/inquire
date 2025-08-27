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

- `Create` - Create tables and schemas
- `Alter` - Modify existing tables
- `Select` - Query data with joins, conditions, and aggregations
- `Insert` - Insert single or multiple records
- `Update` - Update existing records
- `Delete` - Delete records with conditions

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

## Examples

This document provides comprehensive examples of using the Inquire SQL library across different scenarios and database engines.

### Table of Contents

- [Basic CRUD Operations](#basic-crud-operations)
- [Advanced Query Building](#advanced-query-building)
- [Schema Management](#schema-management)
- [Transactions](#transactions)
- [Type Safety Examples](#type-safety-examples)
- [Database-Specific Examples](#database-specific-examples)

### Basic CRUD Operations

#### Creating Tables

```typescript
// Basic table creation
await engine.create('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('email', { type: 'VARCHAR', length: 255 })
  .addField('created_at', { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' })
  .addPrimaryKey('id')
  .addUniqueKey('unique_email', ['email']);

// Table with foreign keys
await engine.create('posts')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('user_id', { type: 'INTEGER' })
  .addField('title', { type: 'VARCHAR', length: 255 })
  .addField('content', { type: 'TEXT' })
  .addField('published', { type: 'BOOLEAN', default: false })
  .addPrimaryKey('id')
  .addForeignKey('fk_user', { 
    local: ['user_id'], 
    foreign: { table: 'users', columns: ['id'] },
    onDelete: 'CASCADE'
  });
```

#### Inserting Data

```typescript
// Insert single record
await engine.insert('users')
  .values({ 
    name: 'John Doe', 
    email: 'john@example.com' 
  });

// Insert multiple records
await engine.insert('users')
  .values([
    { name: 'Alice Smith', email: 'alice@example.com' },
    { name: 'Bob Johnson', email: 'bob@example.com' },
    { name: 'Carol Williams', email: 'carol@example.com' }
  ]);

// Insert with returning (PostgreSQL/SQLite)
const newUsers = await engine.insert('users')
  .values({ name: 'Jane Doe', email: 'jane@example.com' })
  .returning('*');
```

#### Selecting Data

```typescript
// Basic select
const allUsers = await engine.select('*').from('users');

// Select specific columns
const userNames = await engine.select(['id', 'name']).from('users');

// Select with conditions
const activeUsers = await engine.select('*')
  .from('users')
  .where('active = ?', [true])
  .where('created_at > ?', [new Date('2024-01-01')]);

// Select with ordering and limiting
const recentUsers = await engine.select('*')
  .from('users')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .offset(20);

// Select with joins
const usersWithPosts = await engine.select([
    'u.id',
    'u.name',
    'u.email',
    'p.title',
    'p.content'
  ])
  .from('users u')
  .leftJoin('posts p', 'u.id = p.user_id')
  .where('u.active = ?', [true]);
```

#### Updating Data

```typescript
// Update single record
await engine.update('users')
  .set({ email: 'newemail@example.com' })
  .where('id = ?', [1]);

// Update multiple fields
await engine.update('users')
  .set({ 
    name: 'John Smith',
    email: 'johnsmith@example.com',
    updated_at: new Date()
  })
  .where('id = ?', [1]);

// Update with conditions
await engine.update('posts')
  .set({ published: true })
  .where('user_id = ?', [1])
  .where('created_at > ?', [new Date('2024-01-01')]);
```

#### Deleting Data

```typescript
// Delete specific record
await engine.delete('users')
  .where('id = ?', [1]);

// Delete with multiple conditions
await engine.delete('posts')
  .where('published = ?', [false])
  .where('created_at < ?', [new Date('2023-01-01')]);

// Delete all records (use with caution)
await engine.delete('temp_data');
```

### Advanced Query Building

#### Complex Joins

```typescript
// Multiple joins with aliases
const complexQuery = await engine.select([
    'u.id as user_id',
    'u.name as user_name',
    'p.title as post_title',
    'c.content as comment_content',
    'cat.name as category_name'
  ])
  .from('users u')
  .innerJoin('posts p', 'u.id = p.user_id')
  .leftJoin('comments c', 'p.id = c.post_id')
  .leftJoin('categories cat', 'p.category_id = cat.id')
  .where('u.active = ?', [true])
  .where('p.published = ?', [true])
  .orderBy('p.created_at', 'DESC');
```

#### Subqueries

```typescript
// Using template strings for subqueries
const usersWithPostCount = await engine.sql<{
  id: number;
  name: string;
  post_count: number;
}>`
  SELECT 
    u.id,
    u.name,
    (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) as post_count
  FROM users u
  WHERE u.active = ${true}
  ORDER BY post_count DESC
`;
```

#### Aggregations

```typescript
// Group by with aggregations
const userStats = await engine.select([
    'user_id',
    'COUNT(*) as post_count',
    'MAX(created_at) as latest_post',
    'MIN(created_at) as first_post'
  ])
  .from('posts')
  .where('published = ?', [true])
  .groupBy('user_id')
  .having('COUNT(*) > ?', [5])
  .orderBy('post_count', 'DESC');
```

#### Window Functions (PostgreSQL)

```typescript
const rankedPosts = await engine.sql<{
  id: number;
  title: string;
  user_id: number;
  rank: number;
}>`
  SELECT 
    id,
    title,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rank
  FROM posts
  WHERE published = ${true}
`;
```

### Schema Management

#### Table Alterations

```typescript
// Add new columns
await engine.alter('users')
  .addField('phone', { type: 'VARCHAR', length: 20 })
  .addField('address', { type: 'TEXT', nullable: true });

// Modify existing columns
await engine.alter('users')
  .changeField('email', { type: 'VARCHAR', length: 320 });

// Add indexes
await engine.alter('users')
  .addIndex('idx_phone', ['phone'])
  .addIndex('idx_name_email', ['name', 'email']);

// Drop columns and indexes
await engine.alter('users')
  .removeField('old_column')
  .removeIndex('old_index');
```

#### Schema Comparison and Migration

```typescript
// Define old schema
const oldSchema = engine.create('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 100 })
  .addPrimaryKey('id');

// Define new schema
const newSchema = engine.create('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('email', { type: 'VARCHAR', length: 255 })
  .addField('created_at', { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' })
  .addPrimaryKey('id')
  .addUniqueKey('unique_email', ['email']);

// Generate migration
const migration = engine.diff(oldSchema, newSchema);
await migration;
```

#### Table Management

```typescript
// Drop table
await engine.drop('old_table');

// Rename table
await engine.rename('old_name', 'new_name');

// Truncate table
await engine.truncate('temp_data');

// Truncate with cascade (PostgreSQL)
await engine.truncate('parent_table', true);
```

### Transactions

#### Basic Transactions

```typescript
const result = await engine.transaction(async (trx) => {
  // Insert user
  const userResult = await trx.insert('users')
    .values({ name: 'Alice', email: 'alice@example.com' });
  
  // Insert user profile
  await trx.insert('profiles')
    .values({ 
      user_id: userResult.insertId, 
      bio: 'Software developer',
      website: 'https://alice.dev'
    });
  
  // Insert initial posts
  await trx.insert('posts')
    .values([
      { 
        user_id: userResult.insertId, 
        title: 'Hello World', 
        content: 'My first post!' 
      },
      { 
        user_id: userResult.insertId, 
        title: 'About Me', 
        content: 'Learn more about me...' 
      }
    ]);
  
  return { userId: userResult.insertId, success: true };
});
```

#### Error Handling in Transactions

```typescript
try {
  const result = await engine.transaction(async (trx) => {
    await trx.insert('users')
      .values({ name: 'Bob', email: 'existing@example.com' }); // This might fail
    
    await trx.insert('posts')
      .values({ user_id: 999, title: 'Test' }); // This might also fail
    
    return 'success';
  });
} catch (error) {
  console.log('Transaction failed and was rolled back:', error.message);
}
```

### Type Safety Examples

#### Defining Types

```typescript
// Define your data types
type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: Date;
};

type Post = {
  id: number;
  user_id: number;
  title: string;
  content: string;
  published: boolean;
  created_at: Date;
};

type UserWithPosts = User & {
  posts: Post[];
};
```

#### Type-Safe Queries

```typescript
// Type-safe select
const users: User[] = await engine.select<User>('*').from('users');

// Type-safe insert
const newUser: User[] = await engine.insert<User>('users')
  .values({ 
    name: 'John Doe', 
    email: 'john@example.com',
    active: true 
  })
  .returning('*');

// Type-safe template strings
const activeUsers: User[] = await engine.sql<User>`
  SELECT * FROM users 
  WHERE active = ${true} 
  AND created_at > ${new Date('2024-01-01')}
`;

// Type-safe complex queries
const userStats: Array<{
  user_id: number;
  name: string;
  post_count: number;
  latest_post: Date;
}> = await engine.sql`
  SELECT 
    u.id as user_id,
    u.name,
    COUNT(p.id) as post_count,
    MAX(p.created_at) as latest_post
  FROM users u
  LEFT JOIN posts p ON u.id = p.user_id
  WHERE u.active = ${true}
  GROUP BY u.id, u.name
  HAVING COUNT(p.id) > ${0}
  ORDER BY post_count DESC
`;
```

### Database-Specific Examples

#### MySQL Examples

```typescript
import mysql from 'mysql2/promise';
import connect from '@stackpress/inquire-mysql2';

// Connection setup
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp'
});

const engine = connect(connection);

// MySQL-specific features
await engine.create('users')
  .addField('id', { type: 'INT', autoIncrement: true, unsigned: true })
  .addField('name', { type: 'VARCHAR', length: 255, charset: 'utf8mb4' })
  .addField('created_at', { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' })
  .addPrimaryKey('id')
  .engine('InnoDB')
  .charset('utf8mb4');

// Using last insert ID
await engine.insert('users').values({ name: 'John' });
console.log('Last inserted ID:', engine.connection.lastId);
```

#### PostgreSQL Examples

```typescript
import { Pool } from 'pg';
import connect from '@stackpress/inquire-pg';

// Connection setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'myapp',
  password: 'password',
  port: 5432,
});

const connection = await pool.connect();
const engine = connect(connection);

// PostgreSQL-specific features
await engine.create('users')
  .addField('id', { type: 'SERIAL', primaryKey: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('data', { type: 'JSONB' })
  .addField('created_at', { type: 'TIMESTAMP', default: 'NOW()' });

// Using RETURNING clause
const newUsers = await engine.insert('users')
  .values({ name: 'Alice', data: { role: 'admin' } })
  .returning('*');

// PostgreSQL arrays and JSON
const usersWithJsonData = await engine.sql<{
  id: number;
  name: string;
  roles: string[];
}>`
  SELECT 
    id,
    name,
    data->>'roles' as roles
  FROM users 
  WHERE data ? ${'role'}
`;
```

#### SQLite Examples

```typescript
import Database from 'better-sqlite3';
import connect from '@stackpress/inquire-sqlite3';

// Connection setup
const db = new Database('myapp.db');
const engine = connect(db);

// SQLite-specific features
await engine.create('users')
  .addField('id', { type: 'INTEGER', primaryKey: true, autoIncrement: true })
  .addField('name', { type: 'TEXT' })
  .addField('data', { type: 'TEXT' }) // JSON as TEXT
  .addField('created_at', { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' });

// SQLite doesn't support boolean, so use INTEGER
await engine.insert('users')
  .values({ 
    name: 'Bob', 
    active: 1, // boolean as integer
    data: JSON.stringify({ role: 'user' })
  });

// Using last insert row ID
await engine.insert('users').values({ name: 'Carol' });
console.log('Last inserted row ID:', engine.connection.lastId);
```

#### PGLite Examples

```typescript
import { PGlite } from '@electric-sql/pglite';
import connect from '@stackpress/inquire-pglite';

// Connection setup (in-memory)
const db = new PGlite();
const engine = connect(db);

// PGLite works like PostgreSQL
await engine.create('users')
  .addField('id', { type: 'SERIAL', primaryKey: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('email', { type: 'VARCHAR', length: 255 })
  .addField('created_at', { type: 'TIMESTAMP', default: 'NOW()' });

// All PostgreSQL features work
const users = await engine.sql<User>`
  SELECT * FROM users 
  WHERE created_at > ${new Date('2024-01-01')}
  ORDER BY created_at DESC
`;
```

### Real-World Use Cases

#### Blog Application

```typescript
// Create blog schema
await engine.create('categories')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 100 })
  .addField('slug', { type: 'VARCHAR', length: 100 })
  .addPrimaryKey('id')
  .addUniqueKey('unique_slug', ['slug']);

await engine.create('posts')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('title', { type: 'VARCHAR', length: 255 })
  .addField('slug', { type: 'VARCHAR', length: 255 })
  .addField('content', { type: 'TEXT' })
  .addField('excerpt', { type: 'TEXT' })
  .addField('category_id', { type: 'INTEGER' })
  .addField('published', { type: 'BOOLEAN', default: false })
  .addField('created_at', { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' })
  .addField('updated_at', { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' })
  .addPrimaryKey('id')
  .addUniqueKey('unique_slug', ['slug'])
  .addIndex('idx_category', ['category_id'])
  .addIndex('idx_published', ['published'])
  .addForeignKey('fk_category', {
    local: ['category_id'],
    foreign: { table: 'categories', columns: ['id'] }
  });

// Get published posts with categories
const publishedPosts = await engine.select([
    'p.id',
    'p.title',
    'p.slug',
    'p.excerpt',
    'p.created_at',
    'c.name as category_name',
    'c.slug as category_slug'
  ])
  .from('posts p')
  .innerJoin('categories c', 'p.category_id = c.id')
  .where('p.published = ?', [true])
  .orderBy('p.created_at', 'DESC')
  .limit(10);
```

#### E-commerce Product Catalog

```typescript
// Create product schema
await engine.create('products')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('description', { type: 'TEXT' })
  .addField('price', { type: 'DECIMAL', precision: 10, scale: 2 })
  .addField('stock_quantity', { type: 'INTEGER', default: 0 })
  .addField('active', { type: 'BOOLEAN', default: true })
  .addField('created_at', { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' })
  .addPrimaryKey('id')
  .addIndex('idx_active', ['active'])
  .addIndex('idx_price', ['price']);

// Search products with filters
const searchProducts = async (filters: {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}) => {
  let query = engine.select('*').from('products').where('active = ?', [true]);
  
  if (filters.search) {
    query = query.where('name LIKE ?', [`%${filters.search}%`]);
  }
  
  if (filters.minPrice !== undefined) {
    query = query.where('price >= ?', [filters.minPrice]);
  }
  
  if (filters.maxPrice !== undefined) {
    query = query.where('price <= ?', [filters.maxPrice]);
  }
  
  if (filters.inStock) {
    query = query.where('stock_quantity > ?', [0]);
  }
  
  return await query.orderBy('name', 'ASC');
};

// Usage
const results = await searchProducts({
  search: 'laptop',
  minPrice: 500,
  maxPrice: 2000,
  inStock: true
});
```

This comprehensive examples documentation covers the most common use cases and patterns for using the Inquire library across different scenarios and database engines. Check out the [examples directory](./examples) for complete working examples with different database engines:

- [MySQL Example](./examples/with-mysql2)
- [PostgreSQL Example](./examples/with-pg)
- [SQLite Example](./examples/with-sqlite3)
- [PGLite Example](./examples/with-pglite)

## Engine

The `Engine` class serves as the core component for building and executing SQL queries. It provides a unified interface for various SQL operations, abstracting the underlying database engine while maintaining type safety.

```typescript
import { Engine } from '@stackpress/inquire';
import connect from '@stackpress/inquire-mysql2';

const engine = connect(connection);
```

### Properties

The following properties are available when instantiating an Engine.

| Property | Type | Description |
|----------|------|-------------|
| `connection` | `Connection<R>` | The database connection used by the engine |
| `dialect` | `Dialect` | Returns the SQL dialect associated with the connection |

### Methods

The following methods are available when instantiating an Engine.

#### Creating Tables

The following example shows how to create a new table using the create query builder.

```typescript
const create = engine.create('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('email', { type: 'VARCHAR', length: 255 })
  .addPrimaryKey('id');

await create;
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table to create |

**Returns**

A `Create<R>` query builder instance for creating tables.

#### Altering Tables

The following example shows how to modify an existing table using the alter query builder.

```typescript
const alter = engine.alter('users')
  .addField('age', { type: 'INTEGER' })
  .addIndex('idx_email', ['email']);

await alter;
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table to alter |

**Returns**

An `Alter<R>` query builder instance for modifying tables.

#### Selecting Data

The following example shows how to query data using the select query builder.

```typescript
const users = await engine.select('*')
  .from('users')
  .where('age > ?', [18])
  .orderBy('name', 'ASC')
  .limit(10);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | The columns to select (optional, defaults to '*') |

**Returns**

A `Select<R>` query builder instance for querying data.

#### Inserting Data

The following example shows how to insert data using the insert query builder.

```typescript
// Insert single record
await engine.insert('users')
  .values({ name: 'John Doe', email: 'john@example.com' });

// Insert multiple records
await engine.insert('users')
  .values([
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ]);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table to insert into |

**Returns**

An `Insert<R>` query builder instance for inserting data.

#### Updating Data

The following example shows how to update existing data using the update query builder.

```typescript
await engine.update('users')
  .set({ email: 'newemail@example.com' })
  .where('id = ?', [1]);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table to update |

**Returns**

An `Update<R>` query builder instance for updating data.

#### Deleting Data

The following example shows how to delete data using the delete query builder.

```typescript
await engine.delete('users')
  .where('age < ?', [18]);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table to delete from |

**Returns**

A `Delete<R>` query builder instance for deleting data.

#### Executing Raw Queries

The following example shows how to execute raw SQL queries.

```typescript
// Using query method with string
const results = await engine.query<User>(
  'SELECT * FROM users WHERE id = ?', 
  [1]
);

// Using query method with QueryObject
const results = await engine.query<User>({
  query: 'SELECT * FROM users WHERE id = ?',
  values: [1]
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `query` | `string\|QueryObject` | The SQL query string or query object |
| `values` | `Value[]` | Parameter values for the query (optional) |

**Returns**

A promise that resolves to an array of results typed as `R[]`.

#### Template String Queries

The following example shows how to use template string queries with type safety.

```typescript
type User = {
  id: number;
  name: string;
  email: string;
};

const userId = 123;
const results = await engine.sql<User>`
  SELECT * FROM users 
  WHERE id = ${userId} 
  AND status = ${'active'}
`;
// results is typed as User[]
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `strings` | `string[]` | Template string parts |
| `...values` | `Value[]` | Template string values |

**Returns**

A promise that resolves to an array of results typed as `R[]`.

#### Managing Transactions

The following example shows how to execute multiple queries in a transaction.

```typescript
const result = await engine.transaction(async (trx) => {
  // Insert user
  const userResult = await trx.insert('users')
    .values({ name: 'Alice', email: 'alice@example.com' });
  
  // Insert related data
  await trx.insert('profiles')
    .values({ user_id: userResult.insertId, bio: 'Hello world' });
  
  return { success: true, userId: userResult.insertId };
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `callback` | `Transaction<R>` | Callback function that receives the transaction connection |

**Returns**

A promise that resolves to the return value of the callback function.

#### Dropping Tables

The following example shows how to drop a table.

```typescript
await engine.drop('old_table');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table to drop |

**Returns**

A promise that resolves when the table is dropped.

#### Renaming Tables

The following example shows how to rename a table.

```typescript
await engine.rename('old_table', 'new_table');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `from` | `string` | The current name of the table |
| `to` | `string` | The new name for the table |

**Returns**

A promise that resolves when the table is renamed.

#### Truncating Tables

The following example shows how to truncate a table.

```typescript
// Basic truncate
await engine.truncate('users');

// Truncate with cascade (PostgreSQL)
await engine.truncate('users', true);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table to truncate |
| `cascade` | `boolean` | Whether to cascade the truncation (default: false) |

**Returns**

A promise that resolves when the table is truncated.

#### Comparing Table Schemas

The following example shows how to compare two table schemas and generate an alter query.

```typescript
const oldSchema = engine.create('users')
  .addField('id', { type: 'INTEGER' })
  .addField('name', { type: 'VARCHAR', length: 100 });

const newSchema = engine.create('users')
  .addField('id', { type: 'INTEGER' })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('email', { type: 'VARCHAR', length: 255 });

const alterQuery = engine.diff(oldSchema, newSchema);
await alterQuery;
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `from` | `Create` | The original table schema |
| `to` | `Create` | The target table schema |

**Returns**

An `Alter` query builder that contains the necessary changes to transform the first schema into the second.

### Type Safety

The Engine class is designed with TypeScript generics to provide type safety:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
};

// Type-safe select
const users = await engine.select<User>('*').from('users');
// users is typed as User[]

// Type-safe template strings
const user = await engine.sql<User>`SELECT * FROM users WHERE id = ${1}`;
// user is typed as User[]

// Type-safe insert with returning
const result = await engine.insert<User>('users')
  .values({ name: 'John', email: 'john@example.com' })
  .returning('*');
// result is typed as User[]
```

### Error Handling

The Engine class uses the `InquireException` for error handling:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await engine.select('*').from('nonexistent_table');
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Inquire error:', error.message);
  }
}
```

## Alter

The Alter builder is used to modify existing table structures by adding, removing, or changing fields and constraints. It provides a fluent API for making incremental changes to database schemas.

```typescript
const alter = engine.alter('users')
  .addField('phone', { type: 'VARCHAR', length: 20 })
  .changeField('email', { type: 'VARCHAR', length: 320 })
  .addIndex('idx_phone', ['phone']);

await alter;
```

### Properties

The following properties are available when instantiating an Alter builder.

| Property | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table being altered |
| `engine` | `Engine` | The database engine instance |

### Methods

The following methods are available when using an Alter builder.

#### Adding Fields

The following example shows how to add new fields to an existing table.

```typescript
await engine.alter('users')
  .addField('phone', { 
    type: 'VARCHAR', 
    length: 20, 
    nullable: true 
  })
  .addField('address', { 
    type: 'TEXT', 
    nullable: true 
  })
  .addField('birth_date', { 
    type: 'DATE', 
    nullable: true 
  })
  .addField('is_verified', { 
    type: 'BOOLEAN', 
    default: false 
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | The field name |
| `options` | `FieldOptions` | Field configuration options |

**Field Options**

| Option | Type | Description |
|--------|------|-------------|
| `type` | `string` | SQL data type (INTEGER, VARCHAR, TEXT, etc.) |
| `length` | `number` | Field length for VARCHAR, CHAR types |
| `precision` | `number` | Precision for DECIMAL types |
| `scale` | `number` | Scale for DECIMAL types |
| `nullable` | `boolean` | Whether field can be NULL (default: true) |
| `default` | `any` | Default value for the field |
| `autoIncrement` | `boolean` | Auto-increment for numeric fields |
| `unsigned` | `boolean` | Unsigned for numeric fields (MySQL) |
| `comment` | `string` | Field comment |

**Returns**

The Alter builder instance to allow method chaining.

#### Removing Fields

The following example shows how to remove fields from an existing table.

```typescript
await engine.alter('users')
  .removeField('old_column')
  .removeField('deprecated_field')
  .removeField('unused_data');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | The field name to remove |

**Returns**

The Alter builder instance to allow method chaining.

#### Changing Fields

The following example shows how to modify existing field definitions.

```typescript
await engine.alter('users')
  .changeField('email', { 
    type: 'VARCHAR', 
    length: 320, 
    nullable: false 
  })
  .changeField('name', { 
    type: 'VARCHAR', 
    length: 500 
  })
  .changeField('age', { 
    type: 'SMALLINT', 
    unsigned: true 
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | The field name to change |
| `options` | `FieldOptions` | New field configuration options |

**Returns**

The Alter builder instance to allow method chaining.

#### Adding Primary Keys

The following example shows how to add primary key constraints to existing tables.

```typescript
// Add single column primary key
await engine.alter('categories')
  .addPrimaryKey('id');

// Add composite primary key
await engine.alter('user_permissions')
  .addPrimaryKey(['user_id', 'permission_id']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | Column name(s) for the primary key |

**Returns**

The Alter builder instance to allow method chaining.

#### Removing Primary Keys

The following example shows how to remove primary key constraints.

```typescript
await engine.alter('users')
  .removePrimaryKey('old_id');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `column` | `string` | The primary key column to remove |

**Returns**

The Alter builder instance to allow method chaining.

#### Adding Unique Keys

The following example shows how to add unique constraints to existing tables.

```typescript
await engine.alter('users')
  .addUniqueKey('unique_email', ['email'])
  .addUniqueKey('unique_username', ['username'])
  .addUniqueKey('unique_phone_country', ['phone', 'country_code']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the unique constraint |
| `columns` | `string[]` | Column names for the unique key |

**Returns**

The Alter builder instance to allow method chaining.

#### Removing Unique Keys

The following example shows how to remove unique constraints.

```typescript
await engine.alter('users')
  .removeUniqueKey('old_unique_constraint')
  .removeUniqueKey('deprecated_unique');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the unique constraint to remove |

**Returns**

The Alter builder instance to allow method chaining.

#### Adding Indexes

The following example shows how to add indexes to existing tables for improved query performance.

```typescript
await engine.alter('posts')
  .addIndex('idx_title', ['title'])
  .addIndex('idx_published_date', ['published', 'created_at'])
  .addIndex('idx_user_status', ['user_id', 'status'])
  .addIndex('idx_category', ['category_id']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the index |
| `columns` | `string[]` | Column names for the index |

**Returns**

The Alter builder instance to allow method chaining.

#### Removing Indexes

The following example shows how to remove indexes from tables.

```typescript
await engine.alter('posts')
  .removeIndex('old_index')
  .removeIndex('unused_index')
  .removeIndex('deprecated_idx');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the index to remove |

**Returns**

The Alter builder instance to allow method chaining.

#### Adding Foreign Keys

The following example shows how to add foreign key constraints to establish relationships.

```typescript
await engine.alter('posts')
  .addForeignKey('fk_user', {
    local: ['user_id'],
    foreign: { table: 'users', columns: ['id'] },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  })
  .addForeignKey('fk_category', {
    local: ['category_id'],
    foreign: { table: 'categories', columns: ['id'] },
    onUpdate: 'RESTRICT',
    onDelete: 'SET NULL'
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the foreign key constraint |
| `options` | `ForeignKeyOptions` | Foreign key configuration |

**Foreign Key Options**

| Option | Type | Description |
|--------|------|-------------|
| `local` | `string[]` | Local column names |
| `foreign` | `{ table: string, columns: string[] }` | Foreign table and columns |
| `onUpdate` | `string` | Action on update (CASCADE, RESTRICT, SET NULL, etc.) |
| `onDelete` | `string` | Action on delete (CASCADE, RESTRICT, SET NULL, etc.) |

**Returns**

The Alter builder instance to allow method chaining.

#### Removing Foreign Keys

The following example shows how to remove foreign key constraints.

```typescript
await engine.alter('posts')
  .removeForeignKey('old_fk_constraint')
  .removeForeignKey('deprecated_foreign_key');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the foreign key constraint to remove |

**Returns**

The Alter builder instance to allow method chaining.

#### Getting Query Information

The following example shows how to inspect the generated SQL before execution.

```typescript
const alterBuilder = engine.alter('users')
  .addField('phone', { type: 'VARCHAR', length: 20 })
  .addIndex('idx_phone', ['phone']);

const queries = alterBuilder.query();
queries.forEach(({ query, values }) => {
  console.log('SQL:', query);
  console.log('Values:', values);
});

// Then execute
await alterBuilder;
```

**Returns**

An array of objects containing SQL query strings and parameter values, as ALTER operations may generate multiple SQL statements.

### Common Alteration Patterns

#### Adding New Features

```typescript
// Add user profile fields
await engine.alter('users')
  .addField('avatar', { type: 'VARCHAR', length: 500, nullable: true })
  .addField('bio', { type: 'TEXT', nullable: true })
  .addField('website', { type: 'VARCHAR', length: 255, nullable: true })
  .addField('location', { type: 'VARCHAR', length: 100, nullable: true })
  .addIndex('idx_location', ['location']);
```

#### Improving Performance

```typescript
// Add indexes for better query performance
await engine.alter('orders')
  .addIndex('idx_customer_date', ['customer_id', 'created_at'])
  .addIndex('idx_status', ['status'])
  .addIndex('idx_total_amount', ['total_amount']);
```

#### Data Type Migrations

```typescript
// Upgrade field types for better data handling
await engine.alter('products')
  .changeField('price', { 
    type: 'DECIMAL', 
    precision: 12, 
    scale: 4 
  })
  .changeField('description', { 
    type: 'LONGTEXT' 
  })
  .changeField('sku', { 
    type: 'VARCHAR', 
    length: 100, 
    nullable: false 
  });
```

#### Adding Relationships

```typescript
// Add foreign key relationships
await engine.alter('order_items')
  .addField('product_variant_id', { type: 'INTEGER', nullable: true })
  .addForeignKey('fk_product_variant', {
    local: ['product_variant_id'],
    foreign: { table: 'product_variants', columns: ['id'] },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  })
  .addIndex('idx_product_variant', ['product_variant_id']);
```

### Database-Specific Features

#### MySQL Features

```typescript
await engine.alter('users')
  .addField('data', { type: 'JSON' })
  .addField('tags', { type: 'SET', values: ['admin', 'user', 'guest'] })
  .changeField('id', { type: 'BIGINT', unsigned: true, autoIncrement: true });
```

#### PostgreSQL Features

```typescript
await engine.alter('users')
  .addField('metadata', { type: 'JSONB' })
  .addField('tags', { type: 'TEXT[]' })
  .addField('coordinates', { type: 'POINT' });
```

#### SQLite Features

```typescript
// Note: SQLite has limited ALTER TABLE support
await engine.alter('users')
  .addField('phone', { type: 'TEXT' })
  .addField('active', { type: 'INTEGER', default: 1 }); // Boolean as INTEGER
```

### Migration Strategies

#### Safe Column Addition

```typescript
// Add columns with default values to avoid NULL issues
await engine.alter('users')
  .addField('email_verified', { 
    type: 'BOOLEAN', 
    default: false, 
    nullable: false 
  })
  .addField('created_at', { 
    type: 'TIMESTAMP', 
    default: 'CURRENT_TIMESTAMP', 
    nullable: false 
  });
```

#### Gradual Schema Changes

```typescript
// Step 1: Add new column
await engine.alter('users')
  .addField('new_email', { type: 'VARCHAR', length: 320, nullable: true });

// Step 2: Migrate data (separate operation)
// await engine.update('users').set({ new_email: engine.raw('email') });

// Step 3: Make new column non-nullable and add constraints
await engine.alter('users')
  .changeField('new_email', { type: 'VARCHAR', length: 320, nullable: false })
  .addUniqueKey('unique_new_email', ['new_email']);

// Step 4: Remove old column
await engine.alter('users')
  .removeField('email');
```

### Type Safety

The Alter builder supports TypeScript generics for type-safe operations:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  created_at: Date;
};

const alterBuilder = engine.alter<User>('users')
  .addField('phone', { type: 'VARCHAR', length: 20, nullable: true })
  .changeField('email', { type: 'VARCHAR', length: 320 })
  .addIndex('idx_phone', ['phone']);

await alterBuilder;
```

### Error Handling

The Alter builder uses consistent error handling through the `InquireException`:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await engine.alter('users')
    .removeField('nonexistent_column')
    .addIndex('invalid_index', ['nonexistent_field']);
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Alter error:', error.message);
  }
}
```

### Complete Example

Here's a comprehensive example showing how to perform a complex table alteration:

```typescript
await engine.alter('blog_posts')
  // Add new fields
  .addField('excerpt', { 
    type: 'TEXT', 
    nullable: true 
  })
  .addField('featured_image', { 
    type: 'VARCHAR', 
    length: 500, 
    nullable: true 
  })
  .addField('meta_title', { 
    type: 'VARCHAR', 
    length: 60, 
    nullable: true 
  })
  .addField('meta_description', { 
    type: 'VARCHAR', 
    length: 160, 
    nullable: true 
  })
  .addField('reading_time', { 
    type: 'INTEGER', 
    unsigned: true, 
    nullable: true 
  })
  .addField('featured', { 
    type: 'BOOLEAN', 
    default: false 
  })
  // Modify existing fields
  .changeField('title', { 
    type: 'VARCHAR', 
    length: 300, 
    nullable: false 
  })
  .changeField('content', { 
    type: 'LONGTEXT', 
    nullable: false 
  })
  // Add indexes for performance
  .addIndex('idx_featured', ['featured'])
  .addIndex('idx_reading_time', ['reading_time'])
  .addIndex('idx_meta_title', ['meta_title'])
  // Add unique constraint
  .addUniqueKey('unique_meta_title', ['meta_title'])
  // Add foreign key for featured image
  .addField('featured_image_id', { 
    type: 'INTEGER', 
    unsigned: true, 
    nullable: true 
  })
  .addForeignKey('fk_featured_image', {
    local: ['featured_image_id'],
    foreign: { table: 'media', columns: ['id'] },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  })
  .addIndex('idx_featured_image', ['featured_image_id']);
```

## Create

The Create builder is used to define and create new database tables with fields, indexes, and constraints. It provides a fluent API for building table schemas that work across different SQL dialects.

```typescript
const create = engine.create('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('email', { type: 'VARCHAR', length: 255 })
  .addPrimaryKey('id');

await create;
```

### Properties

The following properties are available when instantiating a Create builder.

| Property | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table being created |
| `engine` | `Engine` | The database engine instance |

### Methods

The following methods are available when using a Create builder.

#### Adding Fields

The following example shows how to add fields with various data types and options.

```typescript
await engine.create('products')
  .addField('id', { 
    type: 'INTEGER', 
    autoIncrement: true, 
    unsigned: true 
  })
  .addField('name', { 
    type: 'VARCHAR', 
    length: 255, 
    nullable: false 
  })
  .addField('description', { 
    type: 'TEXT', 
    nullable: true 
  })
  .addField('price', { 
    type: 'DECIMAL', 
    precision: 10, 
    scale: 2, 
    default: 0.00 
  })
  .addField('active', { 
    type: 'BOOLEAN', 
    default: true 
  })
  .addField('created_at', { 
    type: 'TIMESTAMP', 
    default: 'CURRENT_TIMESTAMP' 
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | The field name |
| `options` | `FieldOptions` | Field configuration options |

**Field Options**

| Option | Type | Description |
|--------|------|-------------|
| `type` | `string` | SQL data type (INTEGER, VARCHAR, TEXT, etc.) |
| `length` | `number` | Field length for VARCHAR, CHAR types |
| `precision` | `number` | Precision for DECIMAL types |
| `scale` | `number` | Scale for DECIMAL types |
| `nullable` | `boolean` | Whether field can be NULL (default: true) |
| `default` | `any` | Default value for the field |
| `autoIncrement` | `boolean` | Auto-increment for numeric fields |
| `unsigned` | `boolean` | Unsigned for numeric fields (MySQL) |
| `comment` | `string` | Field comment |
| `charset` | `string` | Character set for the field (MySQL) |
| `collation` | `string` | Collation for the field (MySQL) |

**Returns**

The Create builder instance to allow method chaining.

#### Adding Primary Keys

The following example shows how to add primary keys to tables.

```typescript
// Single column primary key
await engine.create('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addPrimaryKey('id');

// Composite primary key
await engine.create('user_roles')
  .addField('user_id', { type: 'INTEGER' })
  .addField('role_id', { type: 'INTEGER' })
  .addPrimaryKey(['user_id', 'role_id']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | Column name(s) for the primary key |

**Returns**

The Create builder instance to allow method chaining.

#### Adding Unique Keys

The following example shows how to add unique constraints to tables.

```typescript
await engine.create('users')
  .addField('email', { type: 'VARCHAR', length: 255 })
  .addField('username', { type: 'VARCHAR', length: 100 })
  .addUniqueKey('unique_email', ['email'])
  .addUniqueKey('unique_username_email', ['username', 'email']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the unique constraint |
| `columns` | `string[]` | Column names for the unique key |

**Returns**

The Create builder instance to allow method chaining.

#### Adding Indexes

The following example shows how to add indexes to tables for improved query performance.

```typescript
await engine.create('posts')
  .addField('title', { type: 'VARCHAR', length: 255 })
  .addField('content', { type: 'TEXT' })
  .addField('published', { type: 'BOOLEAN' })
  .addField('created_at', { type: 'TIMESTAMP' })
  .addIndex('idx_title', ['title'])
  .addIndex('idx_published_created', ['published', 'created_at']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the index |
| `columns` | `string[]` | Column names for the index |

**Returns**

The Create builder instance to allow method chaining.

#### Adding Foreign Keys

The following example shows how to add foreign key constraints to establish relationships between tables.

```typescript
await engine.create('posts')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('user_id', { type: 'INTEGER' })
  .addField('category_id', { type: 'INTEGER' })
  .addField('title', { type: 'VARCHAR', length: 255 })
  .addPrimaryKey('id')
  .addForeignKey('fk_user', {
    local: ['user_id'],
    foreign: { table: 'users', columns: ['id'] },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  })
  .addForeignKey('fk_category', {
    local: ['category_id'],
    foreign: { table: 'categories', columns: ['id'] },
    onUpdate: 'RESTRICT',
    onDelete: 'SET NULL'
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the foreign key constraint |
| `options` | `ForeignKeyOptions` | Foreign key configuration |

**Foreign Key Options**

| Option | Type | Description |
|--------|------|-------------|
| `local` | `string[]` | Local column names |
| `foreign` | `{ table: string, columns: string[] }` | Foreign table and columns |
| `onUpdate` | `string` | Action on update (CASCADE, RESTRICT, SET NULL, etc.) |
| `onDelete` | `string` | Action on delete (CASCADE, RESTRICT, SET NULL, etc.) |

**Returns**

The Create builder instance to allow method chaining.

#### Setting Table Engine (MySQL)

The following example shows how to set the storage engine for MySQL tables.

```typescript
await engine.create('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addPrimaryKey('id')
  .engine('InnoDB'); // or 'MyISAM', 'Memory', etc.
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `engine` | `string` | MySQL storage engine (InnoDB, MyISAM, Memory, etc.) |

**Returns**

The Create builder instance to allow method chaining.

#### Setting Table Charset (MySQL)

The following example shows how to set the character set for MySQL tables.

```typescript
await engine.create('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addPrimaryKey('id')
  .charset('utf8mb4')
  .collation('utf8mb4_unicode_ci');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `charset` | `string` | Character set (utf8, utf8mb4, latin1, etc.) |

**Returns**

The Create builder instance to allow method chaining.

#### Setting Table Collation (MySQL)

The following example shows how to set the collation for MySQL tables.

```typescript
await engine.create('posts')
  .addField('title', { type: 'VARCHAR', length: 255 })
  .addField('content', { type: 'TEXT' })
  .collation('utf8mb4_unicode_ci');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `collation` | `string` | Collation (utf8mb4_unicode_ci, utf8mb4_general_ci, etc.) |

**Returns**

The Create builder instance to allow method chaining.

#### Getting Query Information

The following example shows how to inspect the generated SQL before execution.

```typescript
const createBuilder = engine.create('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addPrimaryKey('id');

const { query, values } = createBuilder.query();
console.log('SQL:', query);
console.log('Values:', values);

// Then execute
await createBuilder;
```

**Returns**

An object containing the SQL query string and parameter values.

### Common Data Types

The Create builder supports various SQL data types that work across different database engines:

#### Numeric Types

```typescript
.addField('id', { type: 'INTEGER', autoIncrement: true })
.addField('age', { type: 'SMALLINT', unsigned: true })
.addField('price', { type: 'DECIMAL', precision: 10, scale: 2 })
.addField('rating', { type: 'FLOAT' })
.addField('score', { type: 'DOUBLE' })
```

#### String Types

```typescript
.addField('name', { type: 'VARCHAR', length: 255 })
.addField('code', { type: 'CHAR', length: 10 })
.addField('description', { type: 'TEXT' })
.addField('content', { type: 'LONGTEXT' }) // MySQL
```

#### Date and Time Types

```typescript
.addField('birth_date', { type: 'DATE' })
.addField('login_time', { type: 'TIME' })
.addField('created_at', { type: 'DATETIME' })
.addField('updated_at', { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' })
```

#### Boolean and Binary Types

```typescript
.addField('active', { type: 'BOOLEAN', default: true })
.addField('data', { type: 'BLOB' })
.addField('config', { type: 'JSON' }) // MySQL/PostgreSQL
.addField('metadata', { type: 'JSONB' }) // PostgreSQL
```

### Database-Specific Features

#### MySQL Features

```typescript
await engine.create('users')
  .addField('id', { type: 'INT', autoIncrement: true, unsigned: true })
  .addField('name', { type: 'VARCHAR', length: 255, charset: 'utf8mb4' })
  .addField('data', { type: 'JSON' })
  .addPrimaryKey('id')
  .engine('InnoDB')
  .charset('utf8mb4')
  .collation('utf8mb4_unicode_ci');
```

#### PostgreSQL Features

```typescript
await engine.create('users')
  .addField('id', { type: 'SERIAL', primaryKey: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('data', { type: 'JSONB' })
  .addField('tags', { type: 'TEXT[]' }); // Array type
```

#### SQLite Features

```typescript
await engine.create('users')
  .addField('id', { type: 'INTEGER', primaryKey: true, autoIncrement: true })
  .addField('name', { type: 'TEXT' })
  .addField('data', { type: 'TEXT' }) // JSON as TEXT
  .addField('created_at', { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' });
```

### Type Safety

The Create builder supports TypeScript generics for type-safe operations:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: Date;
};

const createBuilder = engine.create<User>('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('email', { type: 'VARCHAR', length: 255 })
  .addField('active', { type: 'BOOLEAN', default: true })
  .addField('created_at', { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' })
  .addPrimaryKey('id');

await createBuilder;
```

### Error Handling

The Create builder uses consistent error handling through the `InquireException`:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await engine.create('users')
    .addField('id', { type: 'INVALID_TYPE' })
    .addPrimaryKey('id');
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Create error:', error.message);
  }
}
```

### Complete Example

Here's a comprehensive example showing how to create a complex table with all features:

```typescript
await engine.create('blog_posts')
  .addField('id', { 
    type: 'INTEGER', 
    autoIncrement: true, 
    unsigned: true 
  })
  .addField('user_id', { 
    type: 'INTEGER', 
    unsigned: true, 
    nullable: false 
  })
  .addField('category_id', { 
    type: 'INTEGER', 
    unsigned: true, 
    nullable: true 
  })
  .addField('title', { 
    type: 'VARCHAR', 
    length: 255, 
    nullable: false 
  })
  .addField('slug', { 
    type: 'VARCHAR', 
    length: 255, 
    nullable: false 
  })
  .addField('excerpt', { 
    type: 'TEXT', 
    nullable: true 
  })
  .addField('content', { 
    type: 'LONGTEXT', 
    nullable: false 
  })
  .addField('featured_image', { 
    type: 'VARCHAR', 
    length: 500, 
    nullable: true 
  })
  .addField('published', { 
    type: 'BOOLEAN', 
    default: false 
  })
  .addField('views', { 
    type: 'INTEGER', 
    unsigned: true, 
    default: 0 
  })
  .addField('created_at', { 
    type: 'TIMESTAMP', 
    default: 'CURRENT_TIMESTAMP' 
  })
  .addField('updated_at', { 
    type: 'TIMESTAMP', 
    default: 'CURRENT_TIMESTAMP' 
  })
  .addPrimaryKey('id')
  .addUniqueKey('unique_slug', ['slug'])
  .addIndex('idx_user_published', ['user_id', 'published'])
  .addIndex('idx_category', ['category_id'])
  .addIndex('idx_created_at', ['created_at'])
  .addForeignKey('fk_user', {
    local: ['user_id'],
    foreign: { table: 'users', columns: ['id'] },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  })
  .addForeignKey('fk_category', {
    local: ['category_id'],
    foreign: { table: 'categories', columns: ['id'] },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });
```

## Delete

SQL DELETE query builder for removing records from database tables with type-safe operations and flexible filtering.

```typescript
import { engine } from '@stackpress/inquire';

// Basic delete
await engine.delete('users').where('id = ?', [123]);

// Delete with multiple conditions
await engine.delete('posts')
  .where('status = ?', ['draft'])
  .where('created_at < ?', ['2023-01-01']);

// Type-safe delete
type User = { id: number, name: string, email: string };
const deletedUsers = await engine.delete<User>('users')
  .where('active = ?', [false]);
```

### Properties

The following properties are available when instantiating a Delete builder.

| Property | Type | Description |
|----------|------|-------------|
| `engine` | `Engine` | Database engine instance for query execution |

### Methods

The following methods are available when instantiating a Delete builder.

#### Setting WHERE Conditions

The following example shows how to add WHERE conditions to filter records for deletion.

```typescript
// Single condition
await engine.delete('users').where('id = ?', [123]);

// Multiple conditions (AND logic)
await engine.delete('posts')
  .where('status = ?', ['draft'])
  .where('author_id = ?', [456])
  .where('created_at < ?', ['2023-01-01']);

// Complex conditions
await engine.delete('orders')
  .where('status IN (?, ?)', ['cancelled', 'expired'])
  .where('created_at < NOW() - INTERVAL ? DAY', [30]);

// Using subqueries
await engine.delete('user_sessions')
  .where('user_id IN (SELECT id FROM users WHERE last_login < ?)', ['2023-01-01']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `query` | `string` | SQL WHERE condition with parameter placeholders |
| `values` | `FlatValue[]` | Values to bind to the placeholders (default: []) |

**Returns**

The Delete instance to allow method chaining.

#### Building Query Object

The following example shows how to build the query object without executing it.

```typescript
const deleteBuilder = engine.delete('users').where('active = ?', [false]);
const queryData = deleteBuilder.build();

console.log(queryData);
// {
//   table: 'users',
//   filters: [['active = ?', [false]]]
// }
```

**Returns**

An object containing the table name and filter conditions.

#### Getting Query String

The following example shows how to get the SQL query string and parameters.

```typescript
const deleteBuilder = engine.delete('users').where('id = ?', [123]);
const { query, values } = deleteBuilder.query();

console.log(query);  // DELETE FROM `users` WHERE id = ?
console.log(values); // [123]
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | SQL dialect to use (optional, uses engine's dialect if not provided) |

**Returns**

An object with `query` (SQL string) and `values` (parameter array).

#### Executing the Delete

The following example shows how to execute the delete operation.

```typescript
// Execute and get affected row count
const result = await engine.delete('users').where('active = ?', [false]);
console.log(`Deleted ${result.length} users`);

// Type-safe execution
type User = { id: number, name: string, email: string };
const deletedUsers = await engine.delete<User>('users')
  .where('id IN (?, ?, ?)', [1, 2, 3]);
```

**Returns**

A promise that resolves to an array representing the affected rows.

### Database-Specific Features

#### MySQL

MySQL DELETE operations support additional features and optimizations.

```typescript
// Delete with LIMIT (MySQL specific)
const { query } = engine.delete('logs')
  .where('created_at < ?', ['2023-01-01'])
  .query(engine.dialect);
// Note: LIMIT in DELETE requires raw SQL for MySQL

// Delete with ORDER BY (MySQL specific)
await engine.sql`
  DELETE FROM logs 
  WHERE created_at < ${['2023-01-01']}
  ORDER BY created_at ASC 
  LIMIT 1000
`;

// Multi-table delete (MySQL specific)
await engine.sql`
  DELETE u, p 
  FROM users u 
  LEFT JOIN profiles p ON u.id = p.user_id 
  WHERE u.active = ${[false]}
`;
```

#### PostgreSQL

PostgreSQL DELETE operations with RETURNING clause and advanced features.

```typescript
// Delete with RETURNING (PostgreSQL specific)
const deletedUsers = await engine.sql<User>`
  DELETE FROM users 
  WHERE active = ${[false]}
  RETURNING *
`;

// Delete with CTE (Common Table Expression)
const result = await engine.sql`
  WITH inactive_users AS (
    SELECT id FROM users WHERE last_login < ${['2023-01-01']}
  )
  DELETE FROM user_sessions 
  WHERE user_id IN (SELECT id FROM inactive_users)
`;

// Conditional delete with EXISTS
await engine.delete('posts')
  .where(`EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = posts.author_id 
    AND users.active = ?
  )`, [false]);
```

#### SQLite

SQLite DELETE operations with specific considerations.

```typescript
// Basic delete (SQLite)
await engine.delete('users').where('id = ?', [123]);

// Delete with foreign key constraints
await engine.sql`PRAGMA foreign_keys = ON`;
await engine.delete('users').where('id = ?', [123]);
// Will cascade delete related records if FK constraints are set

// Bulk delete with transaction
const transaction = await engine.transaction();
try {
  await transaction.delete('user_sessions').where('user_id = ?', [123]);
  await transaction.delete('user_profiles').where('user_id = ?', [123]);
  await transaction.delete('users').where('id = ?', [123]);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### Type Safety

The Delete builder supports TypeScript generics for type-safe operations.

```typescript
type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};

type Post = {
  id: number;
  title: string;
  content: string;
  author_id: number;
  status: 'draft' | 'published' | 'archived';
};

// Type-safe delete operations
const deletedUsers = await engine.delete<User>('users')
  .where('active = ?', [false]);

const deletedPosts = await engine.delete<Post>('posts')
  .where('status = ?', ['draft'])
  .where('created_at < ?', ['2023-01-01']);

// Type checking ensures correct usage
// deletedUsers is typed as User[]
// deletedPosts is typed as Post[]
```

### Advanced Patterns

#### Conditional Deletion

The following example shows how to build conditional delete queries.

```typescript
function deleteUsers(filters: {
  inactive?: boolean;
  unverified?: boolean;
  oldAccounts?: string;
}) {
  let deleteQuery = engine.delete('users');

  if (filters.inactive) {
    deleteQuery = deleteQuery.where('active = ?', [false]);
  }

  if (filters.unverified) {
    deleteQuery = deleteQuery.where('email_verified = ?', [false]);
  }

  if (filters.oldAccounts) {
    deleteQuery = deleteQuery.where('created_at < ?', [filters.oldAccounts]);
  }

  return deleteQuery;
}

// Usage
await deleteUsers({ inactive: true, oldAccounts: '2022-01-01' });
```

#### Batch Deletion

The following example shows how to perform batch deletions safely.

```typescript
async function batchDelete<T>(
  table: string,
  condition: string,
  values: any[],
  batchSize: number = 1000
): Promise<number> {
  let totalDeleted = 0;
  let hasMore = true;

  while (hasMore) {
    // Delete in batches to avoid locking issues
    const result = await engine.sql<T>`
      DELETE FROM ${table} 
      WHERE ${condition} 
      LIMIT ${batchSize}
    `;

    totalDeleted += result.length;
    hasMore = result.length === batchSize;

    // Small delay to prevent overwhelming the database
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return totalDeleted;
}

// Usage
const deletedCount = await batchDelete(
  'logs',
  'created_at < ?',
  ['2023-01-01'],
  5000
);
```

#### Safe Deletion with Validation

The following example shows how to implement safe deletion with validation.

```typescript
async function safeDelete(table: string, id: number, userId: number) {
  // First, verify the record exists and belongs to the user
  const record = await engine.select()
    .from(table)
    .where('id = ?', [id])
    .where('user_id = ?', [userId])
    .limit(1);

  if (record.length === 0) {
    throw new Error('Record not found or access denied');
  }

  // Perform the deletion
  const result = await engine.delete(table)
    .where('id = ?', [id])
    .where('user_id = ?', [userId]);

  if (result.length === 0) {
    throw new Error('Failed to delete record');
  }

  return result;
}

// Usage
try {
  await safeDelete('posts', 123, 456);
  console.log('Post deleted successfully');
} catch (error) {
  console.error('Deletion failed:', error.message);
}
```

### Error Handling

The Delete builder provides comprehensive error handling for various scenarios.

```typescript
try {
  // Delete operation that might fail
  await engine.delete('users').where('id = ?', [123]);
} catch (error) {
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    // MySQL foreign key constraint violation
    console.error('Cannot delete: record is referenced by other tables');
  } else if (error.code === '23503') {
    // PostgreSQL foreign key constraint violation
    console.error('Cannot delete: foreign key constraint violation');
  } else if (error.message.includes('FOREIGN KEY constraint failed')) {
    // SQLite foreign key constraint violation
    console.error('Cannot delete: foreign key constraint violation');
  } else {
    console.error('Delete failed:', error.message);
  }
}

// Validation before deletion
async function validateAndDelete(table: string, id: number) {
  // Check if record exists
  const exists = await engine.select()
    .from(table)
    .where('id = ?', [id])
    .limit(1);

  if (exists.length === 0) {
    throw new Error(`Record with id ${id} not found in ${table}`);
  }

  // Check for dependencies (example)
  if (table === 'users') {
    const posts = await engine.select()
      .from('posts')
      .where('author_id = ?', [id])
      .limit(1);

    if (posts.length > 0) {
      throw new Error('Cannot delete user: has associated posts');
    }
  }

  // Perform deletion
  return await engine.delete(table).where('id = ?', [id]);
}
```

### Performance Considerations

#### Indexing for Deletions

Ensure proper indexing for efficient delete operations.

```typescript
// Create indexes for common delete patterns
await engine.sql`CREATE INDEX idx_users_active ON users(active)`;
await engine.sql`CREATE INDEX idx_posts_status ON posts(status)`;
await engine.sql`CREATE INDEX idx_logs_created_at ON logs(created_at)`;

// Efficient deletions using indexed columns
await engine.delete('users').where('active = ?', [false]);
await engine.delete('posts').where('status = ?', ['draft']);
await engine.delete('logs').where('created_at < ?', ['2023-01-01']);
```

#### Transaction Usage

Use transactions for related deletions to ensure data consistency.

```typescript
async function deleteUserAndRelatedData(userId: number) {
  const transaction = await engine.transaction();
  
  try {
    // Delete in reverse dependency order
    await transaction.delete('user_sessions').where('user_id = ?', [userId]);
    await transaction.delete('user_preferences').where('user_id = ?', [userId]);
    await transaction.delete('posts').where('author_id = ?', [userId]);
    await transaction.delete('users').where('id = ?', [userId]);
    
    await transaction.commit();
    console.log('User and related data deleted successfully');
  } catch (error) {
    await transaction.rollback();
    console.error('Failed to delete user data:', error);
    throw error;
  }
}
```

#### Monitoring Delete Operations

Monitor and log delete operations for audit trails.

```typescript
async function auditedDelete(table: string, conditions: string, values: any[]) {
  const startTime = Date.now();
  
  try {
    // Log the operation
    console.log(`Deleting from ${table} where ${conditions}`, values);
    
    const result = await engine.delete(table).where(conditions, values);
    
    const duration = Date.now() - startTime;
    console.log(`Deleted ${result.length} rows from ${table} in ${duration}ms`);
    
    // Log to audit table
    await engine.insert('audit_log').values({
      action: 'DELETE',
      table_name: table,
      conditions: conditions,
      affected_rows: result.length,
      duration: duration,
      timestamp: new Date()
    });
    
    return result;
  } catch (error) {
    console.error(`Delete failed for ${table}:`, error);
    throw error;
  }
}
```

The Delete builder provides a clean, type-safe interface for removing records from your database while supporting advanced patterns like conditional deletion, batch operations, and comprehensive error handling across all supported database engines.

## Insert

The Insert builder handles inserting single or multiple records into tables. It provides a fluent API for building INSERT queries with support for bulk inserts, returning values, and conflict resolution.

```typescript
// Single record
await engine.insert('users')
  .values({ name: 'John Doe', email: 'john@example.com' });

// Multiple records
await engine.insert('users')
  .values([
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ]);
```

### Properties

The following properties are available when instantiating an Insert builder.

| Property | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table to insert into |
| `engine` | `Engine` | The database engine instance |

### Methods

The following methods are available when using an Insert builder.

#### Inserting Values

The following example shows how to insert data into tables.

```typescript
// Single record with all fields
await engine.insert('products')
  .values({
    name: 'Laptop',
    description: 'High-performance laptop',
    price: 999.99,
    stock_quantity: 50,
    active: true,
    created_at: new Date()
  });

// Single record with partial fields
await engine.insert('users')
  .values({
    name: 'Jane Doe',
    email: 'jane@example.com'
    // Other fields will use default values or NULL
  });

// Multiple records
await engine.insert('categories')
  .values([
    { name: 'Electronics', slug: 'electronics', active: true },
    { name: 'Books', slug: 'books', active: true },
    { name: 'Clothing', slug: 'clothing', active: false }
  ]);

// Insert with expressions
await engine.insert('logs')
  .values({
    message: 'User login',
    level: 'info',
    created_at: new Date(),
    data: JSON.stringify({ userId: 123, ip: '192.168.1.1' })
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `data` | `object\|object[]` | Single record object or array of record objects |

**Returns**

The Insert builder instance to allow method chaining.

#### Returning Values (PostgreSQL/SQLite)

The following example shows how to return inserted values.

```typescript
// Return all columns of inserted record
const newUser = await engine.insert('users')
  .values({ name: 'Jane Doe', email: 'jane@example.com' })
  .returning('*');

console.log(newUser[0]); // { id: 1, name: 'Jane Doe', email: 'jane@example.com', ... }

// Return specific columns
const userIds = await engine.insert('users')
  .values([
    { name: 'User 1', email: 'user1@example.com' },
    { name: 'User 2', email: 'user2@example.com' }
  ])
  .returning(['id', 'name']);

console.log(userIds); // [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }]

// Return computed values
const insertResult = await engine.insert('orders')
  .values({
    customer_id: 123,
    total_amount: 99.99,
    status: 'pending'
  })
  .returning(['id', 'created_at', 'total_amount * 1.1 as total_with_tax']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | Column names or expressions to return |

**Returns**

The Insert builder instance to allow method chaining.

#### On Conflict Resolution (PostgreSQL)

The following example shows how to handle conflicts during insertion.

```typescript
// Insert or ignore on conflict
await engine.insert('users')
  .values({ name: 'John', email: 'john@example.com' })
  .onConflict('email')
  .doNothing();

// Insert or update on conflict
await engine.insert('users')
  .values({ 
    name: 'John Smith', 
    email: 'john@example.com',
    updated_at: new Date()
  })
  .onConflict('email')
  .doUpdate({ 
    name: 'John Smith',
    updated_at: new Date()
  });

// Conflict on multiple columns
await engine.insert('user_permissions')
  .values({ user_id: 1, permission_id: 2, granted_by: 'admin' })
  .onConflict(['user_id', 'permission_id'])
  .doUpdate({ granted_by: 'admin', updated_at: new Date() });

// Conditional update on conflict
await engine.insert('products')
  .values({ 
    sku: 'LAPTOP001', 
    name: 'Gaming Laptop',
    price: 1299.99,
    stock: 10
  })
  .onConflict('sku')
  .doUpdate({ 
    name: 'Gaming Laptop',
    price: 1299.99,
    stock: 'products.stock + EXCLUDED.stock' // PostgreSQL syntax
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | Column names that define the conflict |

**Returns**

The Insert builder instance to allow method chaining.

#### On Duplicate Key Update (MySQL)

The following example shows how to handle duplicate key conflicts in MySQL.

```typescript
// Insert or update on duplicate key
await engine.insert('users')
  .values({
    email: 'john@example.com',
    name: 'John Smith',
    login_count: 1,
    last_login: new Date()
  })
  .onDuplicateKeyUpdate({
    name: 'John Smith',
    login_count: 'login_count + 1',
    last_login: new Date()
  });

// Multiple records with duplicate key handling
await engine.insert('page_views')
  .values([
    { page_id: 1, user_id: 123, views: 1 },
    { page_id: 2, user_id: 123, views: 1 },
    { page_id: 1, user_id: 456, views: 1 }
  ])
  .onDuplicateKeyUpdate({
    views: 'views + VALUES(views)',
    updated_at: new Date()
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `updates` | `object` | Fields to update on duplicate key |

**Returns**

The Insert builder instance to allow method chaining.

#### Insert Ignore (MySQL)

The following example shows how to ignore duplicate key errors in MySQL.

```typescript
// Insert and ignore duplicates
await engine.insert('users')
  .ignore()
  .values([
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user1@example.com', name: 'Duplicate User' } // Will be ignored
  ]);

// Insert ignore with single record
await engine.insert('categories')
  .ignore()
  .values({ name: 'Electronics', slug: 'electronics' });
```

**Returns**

The Insert builder instance to allow method chaining.

#### Getting Query Information

The following example shows how to inspect the generated SQL before execution.

```typescript
const insertBuilder = engine.insert('users')
  .values({ name: 'John Doe', email: 'john@example.com' });

const { query, values } = insertBuilder.query();
console.log('SQL:', query);
console.log('Values:', values);

// Then execute
await insertBuilder;
```

**Returns**

An object containing the SQL query string and parameter values.

### Bulk Insert Patterns

#### Large Dataset Insertion

```typescript
// Insert large datasets in batches
const batchSize = 1000;
const users = []; // Assume this is a large array

for (let i = 0; i < users.length; i += batchSize) {
  const batch = users.slice(i, i + batchSize);
  await engine.insert('users').values(batch);
}

// Or using a helper function
const insertInBatches = async (data: any[], batchSize = 1000) => {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await engine.insert('users').values(batch);
  }
};

await insertInBatches(users, 500);
```

#### Data Transformation During Insert

```typescript
// Transform data before insertion
const rawData = [
  { firstName: 'John', lastName: 'Doe', birthYear: 1990 },
  { firstName: 'Jane', lastName: 'Smith', birthYear: 1985 }
];

const transformedData = rawData.map(item => ({
  name: `${item.firstName} ${item.lastName}`,
  age: new Date().getFullYear() - item.birthYear,
  created_at: new Date()
}));

await engine.insert('users').values(transformedData);
```

#### Conditional Insertion

```typescript
// Insert only if certain conditions are met
const userData = { name: 'John Doe', email: 'john@example.com' };

// Check if user exists first
const existingUser = await engine.select('id')
  .from('users')
  .where('email = ?', [userData.email])
  .limit(1);

if (existingUser.length === 0) {
  await engine.insert('users').values(userData);
}

// Or use INSERT ... WHERE NOT EXISTS pattern
await engine.sql`
  INSERT INTO users (name, email)
  SELECT ${userData.name}, ${userData.email}
  WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = ${userData.email}
  )
`;
```

### Database-Specific Features

#### MySQL Features

```typescript
// MySQL-specific data types
await engine.insert('products')
  .values({
    name: 'Product Name',
    metadata: JSON.stringify({ color: 'red', size: 'large' }), // JSON column
    tags: 'electronics,gadgets,tech', // SET column
    created_at: new Date()
  });

// Insert with MySQL functions
await engine.insert('logs')
  .values({
    message: 'System startup',
    level: 'info',
    created_at: new Date(),
    server_time: 'NOW()' // MySQL function
  });

// Get last insert ID (MySQL)
await engine.insert('users')
  .values({ name: 'John', email: 'john@example.com' });

console.log('Last inserted ID:', engine.connection.lastId);
```

#### PostgreSQL Features

```typescript
// PostgreSQL-specific data types
await engine.insert('users')
  .values({
    name: 'John Doe',
    metadata: { role: 'admin', permissions: ['read', 'write'] }, // JSONB
    tags: ['developer', 'admin'], // Array
    coordinates: '(40.7128, -74.0060)' // Point
  });

// Insert with PostgreSQL functions
await engine.insert('events')
  .values({
    name: 'User Registration',
    occurred_at: 'NOW()',
    data: { userId: 123, source: 'web' }
  })
  .returning('*');

// Insert from SELECT (PostgreSQL)
await engine.sql`
  INSERT INTO user_stats (user_id, post_count, last_post_date)
  SELECT 
    user_id,
    COUNT(*) as post_count,
    MAX(created_at) as last_post_date
  FROM posts
  GROUP BY user_id
`;
```

#### SQLite Features

```typescript
// SQLite-specific considerations
await engine.insert('users')
  .values({
    name: 'John Doe',
    active: 1, // Boolean as INTEGER
    metadata: JSON.stringify({ role: 'user' }), // JSON as TEXT
    created_at: new Date().toISOString() // Date as TEXT
  });

// Get last insert row ID (SQLite)
await engine.insert('users')
  .values({ name: 'Jane', email: 'jane@example.com' });

console.log('Last inserted row ID:', engine.connection.lastId);

// Insert or replace (SQLite)
await engine.sql`
  INSERT OR REPLACE INTO settings (key, value)
  VALUES (${key}, ${value})
`;
```

### Type Safety

The Insert builder supports TypeScript generics for type-safe operations:

```typescript
type User = {
  id?: number; // Optional for auto-increment
  name: string;
  email: string;
  active?: boolean;
  created_at?: Date;
};

type NewUser = Omit<User, 'id' | 'created_at'>; // Exclude auto-generated fields

// Type-safe single insert
const newUser: User[] = await engine.insert<User>('users')
  .values({ 
    name: 'John Doe', 
    email: 'john@example.com',
    active: true 
  })
  .returning('*');

// Type-safe bulk insert
const userData: NewUser[] = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
];

const insertedUsers: User[] = await engine.insert<User>('users')
  .values(userData)
  .returning('*');

// Type-safe with partial data
const partialUser: Partial<NewUser> = {
  name: 'Jane Doe'
  // email will be required by TypeScript if not optional
};
```

### Error Handling

The Insert builder uses consistent error handling through the `InquireException`:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await engine.insert('users')
    .values({ 
      name: 'John',
      email: 'invalid-email' // Might violate constraints
    });
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Insert error:', error.message);
    
    // Handle specific error types
    if (error.message.includes('duplicate')) {
      console.log('Duplicate entry detected');
    } else if (error.message.includes('constraint')) {
      console.log('Constraint violation');
    }
  }
}
```

### Performance Considerations

#### Batch Size Optimization

```typescript
// Optimal batch sizes for different databases
const getBatchSize = (dialect: string) => {
  switch (dialect) {
    case 'mysql': return 1000;
    case 'postgresql': return 1000;
    case 'sqlite': return 500;
    default: return 100;
  }
};

const batchSize = getBatchSize(engine.dialect.name);
```

#### Transaction Usage

```typescript
// Use transactions for large inserts
await engine.transaction(async (trx) => {
  // Insert users
  const users = await trx.insert('users')
    .values(userData)
    .returning(['id', 'name']);
  
  // Insert related data
  const profileData = users.map(user => ({
    user_id: user.id,
    bio: `Profile for ${user.name}`,
    created_at: new Date()
  }));
  
  await trx.insert('profiles').values(profileData);
  
  return users;
});
```

### Complete Example

Here's a comprehensive example showing various insert patterns:

```typescript
type Product = {
  id?: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  sku: string;
  stock_quantity: number;
  active: boolean;
  metadata?: object;
  created_at?: Date;
  updated_at?: Date;
};

// Complex insert with conflict resolution
const insertProducts = async (products: Omit<Product, 'id' | 'created_at' | 'updated_at'>[]) => {
  return await engine.transaction(async (trx) => {
    // Insert products with conflict resolution
    const insertedProducts = await trx.insert<Product>('products')
      .values(products.map(product => ({
        ...product,
        created_at: new Date(),
        updated_at: new Date()
      })))
      .onConflict('sku')
      .doUpdate({
        name: 'EXCLUDED.name',
        description: 'EXCLUDED.description',
        price: 'EXCLUDED.price',
        stock_quantity: 'products.stock_quantity + EXCLUDED.stock_quantity',
        updated_at: new Date()
      })
      .returning('*');
    
    // Insert inventory records
    const inventoryData = insertedProducts.map(product => ({
      product_id: product.id!,
      quantity: product.stock_quantity,
      location: 'main-warehouse',
      created_at: new Date()
    }));
    
    await trx.insert('inventory').values(inventoryData);
    
    // Log the insertion
    await trx.insert('audit_log')
      .values({
        action: 'bulk_product_insert',
        details: JSON.stringify({ 
          count: insertedProducts.length,
          skus: insertedProducts.map(p => p.sku)
        }),
        created_at: new Date()
      });
    
    return insertedProducts;
  });
};

// Usage
const newProducts = [
  {
    name: 'Gaming Laptop',
    description: 'High-performance gaming laptop',
    price: 1299.99,
    category_id: 1,
    sku: 'LAPTOP-001',
    stock_quantity: 10,
    active: true,
    metadata: { brand: 'TechCorp', warranty: '2 years' }
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse',
    price: 29.99,
    category_id: 2,
    sku: 'MOUSE-001',
    stock_quantity: 50,
    active: true,
    metadata: { brand: 'TechCorp', color: 'black' }
  }
];

const result = await insertProducts(newProducts);
console.log(`Inserted ${result.length} products`);
```

## Select

The Select builder provides comprehensive querying capabilities with support for joins, conditions, grouping, and ordering. It offers a fluent API for building complex SELECT queries that work across different SQL dialects.

```typescript
const users = await engine.select(['id', 'name', 'email'])
  .from('users')
  .where('active = ?', [true])
  .orderBy('created_at', 'DESC')
  .limit(10);
```

### Properties

The following properties are available when instantiating a Select builder.

| Property | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | The columns being selected |
| `engine` | `Engine` | The database engine instance |

### Methods

The following methods are available when using a Select builder.

#### Selecting Columns

The following example shows how to specify which columns to select from tables.

```typescript
// Select all columns
const allUsers = await engine.select('*').from('users');

// Select specific columns
const userNames = await engine.select(['id', 'name']).from('users');

// Select with aliases
const userInfo = await engine.select([
  'id',
  'name as full_name',
  'email as email_address',
  'created_at as registration_date'
]).from('users');

// Select with expressions
const userStats = await engine.select([
  'id',
  'name',
  'UPPER(email) as email_upper',
  'YEAR(created_at) as registration_year'
]).from('users');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | Column names, expressions, or '*' for all columns |

**Returns**

The Select builder instance to allow method chaining.

#### From Clause

The following example shows how to specify the source table or tables.

```typescript
// Basic from
const users = await engine.select('*').from('users');

// From with alias
const users = await engine.select('u.*').from('users u');

// From with schema (PostgreSQL/MySQL)
const users = await engine.select('*').from('public.users');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table name, optionally with alias or schema |

**Returns**

The Select builder instance to allow method chaining.

#### Where Conditions

The following example shows how to add WHERE conditions to filter results.

```typescript
// Single condition
const activeUsers = await engine.select('*')
  .from('users')
  .where('active = ?', [true]);

// Multiple conditions (AND)
const filteredUsers = await engine.select('*')
  .from('users')
  .where('active = ?', [true])
  .where('created_at > ?', [new Date('2024-01-01')])
  .where('role IN (?)', [['admin', 'user']]);

// OR conditions
const users = await engine.select('*')
  .from('users')
  .where('role = ?', ['admin'])
  .orWhere('permissions LIKE ?', ['%manage%']);

// Complex conditions with grouping
const complexQuery = await engine.select('*')
  .from('users')
  .where('active = ?', [true])
  .where('(role = ? OR permissions LIKE ?)', ['admin', '%manage%']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `condition` | `string` | SQL condition with ? placeholders |
| `values` | `any[]` | Values to replace placeholders |

**Returns**

The Select builder instance to allow method chaining.

#### Joins

The following example shows how to join tables for relational queries.

```typescript
// Inner join
const usersWithPosts = await engine.select([
    'u.id',
    'u.name',
    'p.title',
    'p.created_at as post_date'
  ])
  .from('users u')
  .innerJoin('posts p', 'u.id = p.user_id');

// Left join
const allUsersWithPosts = await engine.select([
    'u.id',
    'u.name',
    'p.title'
  ])
  .from('users u')
  .leftJoin('posts p', 'u.id = p.user_id');

// Right join
const postsWithUsers = await engine.select([
    'p.title',
    'u.name'
  ])
  .from('posts p')
  .rightJoin('users u', 'p.user_id = u.id');

// Multiple joins
const complexQuery = await engine.select([
    'u.name',
    'p.title',
    'c.content as comment',
    'cat.name as category'
  ])
  .from('users u')
  .innerJoin('posts p', 'u.id = p.user_id')
  .leftJoin('comments c', 'p.id = c.post_id')
  .innerJoin('categories cat', 'p.category_id = cat.id');

// Join with additional conditions
const recentPosts = await engine.select([
    'u.name',
    'p.title'
  ])
  .from('users u')
  .innerJoin('posts p', 'u.id = p.user_id AND p.published = ?', [true]);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table to join with optional alias |
| `condition` | `string` | Join condition |
| `values` | `any[]` | Values for join condition placeholders (optional) |

**Returns**

The Select builder instance to allow method chaining.

#### Grouping

The following example shows how to group results and use aggregate functions.

```typescript
// Basic grouping
const userPostCounts = await engine.select([
    'user_id',
    'COUNT(*) as post_count'
  ])
  .from('posts')
  .groupBy('user_id');

// Multiple grouping columns
const categoryStats = await engine.select([
    'category_id',
    'YEAR(created_at) as year',
    'COUNT(*) as post_count',
    'AVG(views) as avg_views'
  ])
  .from('posts')
  .groupBy('category_id', 'YEAR(created_at)');

// Grouping with joins
const userStats = await engine.select([
    'u.id',
    'u.name',
    'COUNT(p.id) as post_count',
    'MAX(p.created_at) as latest_post',
    'MIN(p.created_at) as first_post'
  ])
  .from('users u')
  .leftJoin('posts p', 'u.id = p.user_id')
  .groupBy('u.id', 'u.name');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `...columns` | `string[]` | Column names or expressions to group by |

**Returns**

The Select builder instance to allow method chaining.

#### Having Conditions

The following example shows how to filter grouped results with HAVING clauses.

```typescript
// Basic having
const activeUsers = await engine.select([
    'user_id',
    'COUNT(*) as post_count'
  ])
  .from('posts')
  .where('published = ?', [true])
  .groupBy('user_id')
  .having('COUNT(*) > ?', [5]);

// Multiple having conditions
const userStats = await engine.select([
    'user_id',
    'COUNT(*) as post_count',
    'AVG(views) as avg_views'
  ])
  .from('posts')
  .groupBy('user_id')
  .having('COUNT(*) > ?', [10])
  .having('AVG(views) > ?', [1000]);

// Having with OR conditions
const popularUsers = await engine.select([
    'user_id',
    'COUNT(*) as post_count',
    'SUM(views) as total_views'
  ])
  .from('posts')
  .groupBy('user_id')
  .having('COUNT(*) > ?', [20])
  .orHaving('SUM(views) > ?', [50000]);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `condition` | `string` | HAVING condition with ? placeholders |
| `values` | `any[]` | Values to replace placeholders |

**Returns**

The Select builder instance to allow method chaining.

#### Ordering

The following example shows how to sort query results.

```typescript
// Single column ordering
const users = await engine.select('*')
  .from('users')
  .orderBy('name', 'ASC');

// Multiple column ordering
const posts = await engine.select('*')
  .from('posts')
  .orderBy('published', 'DESC')
  .orderBy('created_at', 'DESC')
  .orderBy('title', 'ASC');

// Ordering by expressions
const userStats = await engine.select([
    'id',
    'name',
    'created_at'
  ])
  .from('users')
  .orderBy('YEAR(created_at)', 'DESC')
  .orderBy('MONTH(created_at)', 'DESC');

// Random ordering
const randomUsers = await engine.select('*')
  .from('users')
  .orderBy('RAND()', 'ASC'); // MySQL
  // .orderBy('RANDOM()', 'ASC'); // PostgreSQL/SQLite
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `column` | `string` | Column name or expression to order by |
| `direction` | `'ASC'\|'DESC'` | Sort direction (default: 'ASC') |

**Returns**

The Select builder instance to allow method chaining.

#### Limiting and Offset

The following example shows how to limit results and implement pagination.

```typescript
// Basic limit
const topUsers = await engine.select('*')
  .from('users')
  .orderBy('created_at', 'DESC')
  .limit(10);

// Limit with offset for pagination
const page2Users = await engine.select('*')
  .from('users')
  .orderBy('id', 'ASC')
  .limit(10)
  .offset(10);

// Pagination helper
const getPage = async (page: number, perPage: number = 20) => {
  return await engine.select('*')
    .from('users')
    .orderBy('id', 'ASC')
    .limit(perPage)
    .offset((page - 1) * perPage);
};

const firstPage = await getPage(1);
const secondPage = await getPage(2);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `count` | `number` | Maximum number of rows to return |

**Returns**

The Select builder instance to allow method chaining.

#### Distinct

The following example shows how to select distinct values.

```typescript
// Distinct all columns
const uniqueUsers = await engine.select('*')
  .from('users')
  .distinct();

// Distinct specific columns
const uniqueEmails = await engine.select(['email'])
  .from('users')
  .distinct();

// Distinct with multiple columns
const uniqueCombinations = await engine.select(['role', 'department'])
  .from('users')
  .distinct();
```

**Returns**

The Select builder instance to allow method chaining.

#### Subqueries

The following example shows how to use subqueries in SELECT statements.

```typescript
// Subquery in WHERE clause
const usersWithPosts = await engine.select('*')
  .from('users')
  .where('id IN (SELECT DISTINCT user_id FROM posts WHERE published = ?)', [true]);

// Subquery in SELECT clause
const usersWithPostCount = await engine.select([
    'id',
    'name',
    '(SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count'
  ])
  .from('users');

// Correlated subquery
const usersWithLatestPost = await engine.select([
    'u.id',
    'u.name',
    '(SELECT title FROM posts p WHERE p.user_id = u.id ORDER BY created_at DESC LIMIT 1) as latest_post'
  ])
  .from('users u');
```

#### Getting Query Information

The following example shows how to inspect the generated SQL before execution.

```typescript
const selectBuilder = engine.select(['id', 'name'])
  .from('users')
  .where('active = ?', [true])
  .orderBy('name', 'ASC')
  .limit(10);

const { query, values } = selectBuilder.query();
console.log('SQL:', query);
console.log('Values:', values);

// Then execute
const results = await selectBuilder;
```

**Returns**

An object containing the SQL query string and parameter values.

### Advanced Query Patterns

#### Window Functions (PostgreSQL/MySQL 8.0+)

```typescript
// Row numbering
const rankedUsers = await engine.select([
    'id',
    'name',
    'created_at',
    'ROW_NUMBER() OVER (ORDER BY created_at) as row_num'
  ])
  .from('users');

// Partitioned ranking
const rankedPosts = await engine.select([
    'id',
    'title',
    'user_id',
    'views',
    'RANK() OVER (PARTITION BY user_id ORDER BY views DESC) as rank_in_user_posts'
  ])
  .from('posts');

// Running totals
const runningTotals = await engine.select([
    'id',
    'amount',
    'created_at',
    'SUM(amount) OVER (ORDER BY created_at) as running_total'
  ])
  .from('orders')
  .orderBy('created_at');
```

#### Common Table Expressions (PostgreSQL/MySQL 8.0+)

```typescript
// Using template strings for CTEs
const hierarchicalData = await engine.sql<{
  id: number;
  name: string;
  level: number;
}>`
  WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 0 as level
    FROM categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
  )
  SELECT id, name, level
  FROM category_tree
  ORDER BY level, name
`;
```

#### Conditional Aggregation

```typescript
// Conditional counts
const userStats = await engine.select([
    'user_id',
    'COUNT(*) as total_posts',
    'COUNT(CASE WHEN published = 1 THEN 1 END) as published_posts',
    'COUNT(CASE WHEN featured = 1 THEN 1 END) as featured_posts'
  ])
  .from('posts')
  .groupBy('user_id');

// Conditional sums
const salesStats = await engine.select([
    'YEAR(created_at) as year',
    'SUM(amount) as total_sales',
    'SUM(CASE WHEN status = "completed" THEN amount ELSE 0 END) as completed_sales',
    'SUM(CASE WHEN status = "refunded" THEN amount ELSE 0 END) as refunded_sales'
  ])
  .from('orders')
  .groupBy('YEAR(created_at)');
```

### Database-Specific Features

#### MySQL Features

```typescript
// MySQL-specific functions
const mysqlQuery = await engine.select([
    'id',
    'name',
    'JSON_EXTRACT(metadata, "$.role") as role',
    'MATCH(title, content) AGAINST(? IN BOOLEAN MODE) as relevance'
  ])
  .from('users')
  .where('MATCH(title, content) AGAINST(? IN BOOLEAN MODE)', ['search term']);

// MySQL date functions
const dateQuery = await engine.select([
    'id',
    'DATE_FORMAT(created_at, "%Y-%m") as month',
    'COUNT(*) as count'
  ])
  .from('posts')
  .groupBy('DATE_FORMAT(created_at, "%Y-%m")');
```

#### PostgreSQL Features

```typescript
// PostgreSQL-specific functions
const pgQuery = await engine.select([
    'id',
    'name',
    'data->>\'role\' as role',
    'array_length(tags, 1) as tag_count'
  ])
  .from('users')
  .where('data ? ?', ['role']);

// PostgreSQL array operations
const arrayQuery = await engine.select([
    'id',
    'title',
    'tags',
    'array_to_string(tags, \', \') as tags_string'
  ])
  .from('posts')
  .where('? = ANY(tags)', ['javascript']);
```

#### SQLite Features

```typescript
// SQLite-specific functions
const sqliteQuery = await engine.select([
    'id',
    'name',
    'substr(email, instr(email, \'@\') + 1) as domain',
    'datetime(created_at, \'localtime\') as local_time'
  ])
  .from('users');
```

### Type Safety

The Select builder supports TypeScript generics for type-safe operations:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: Date;
};

type UserWithPostCount = User & {
  post_count: number;
};

// Type-safe select
const users: User[] = await engine.select<User>('*').from('users');

// Type-safe complex query
const usersWithStats: UserWithPostCount[] = await engine.select<UserWithPostCount>([
    'u.*',
    'COUNT(p.id) as post_count'
  ])
  .from('users u')
  .leftJoin('posts p', 'u.id = p.user_id')
  .groupBy('u.id');
```

### Error Handling

The Select builder uses consistent error handling through the `InquireException`:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await engine.select('*')
    .from('nonexistent_table')
    .where('invalid_column = ?', [1]);
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Select error:', error.message);
  }
}
```

### Complete Example

Here's a comprehensive example showing a complex SELECT query with multiple features:

```typescript
type PostWithDetails = {
  id: number;
  title: string;
  excerpt: string;
  author_name: string;
  author_email: string;
  category_name: string;
  tag_count: number;
  comment_count: number;
  view_count: number;
  published_at: Date;
  is_featured: boolean;
};

const featuredPosts: PostWithDetails[] = await engine.select<PostWithDetails>([
    'p.id',
    'p.title',
    'p.excerpt',
    'u.name as author_name',
    'u.email as author_email',
    'c.name as category_name',
    'COUNT(DISTINCT pt.tag_id) as tag_count',
    'COUNT(DISTINCT cm.id) as comment_count',
    'p.views as view_count',
    'p.published_at',
    'p.featured as is_featured'
  ])
  .from('posts p')
  .innerJoin('users u', 'p.user_id = u.id')
  .innerJoin('categories c', 'p.category_id = c.id')
  .leftJoin('post_tags pt', 'p.id = pt.post_id')
  .leftJoin('comments cm', 'p.id = cm.post_id AND cm.approved = ?', [true])
  .where('p.published = ?', [true])
  .where('p.published_at <= ?', [new Date()])
  .where('u.active = ?', [true])
  .where('(p.featured = ? OR p.views > ?)', [true, 1000])
  .groupBy('p.id', 'u.name', 'u.email', 'c.name')
  .having('COUNT(DISTINCT pt.tag_id) > ?', [0])
  .orderBy('p.featured', 'DESC')
  .orderBy('p.published_at', 'DESC')
  .orderBy('p.views', 'DESC')
  .limit(20);
```

## Update

The Update builder modifies existing records in tables with support for conditions and joins. It provides a fluent API for building UPDATE queries with WHERE clauses, JOIN operations, and returning updated values.

```typescript
await engine.update('users')
  .set({ email: 'newemail@example.com', updated_at: new Date() })
  .where('id = ?', [1]);
```

### Properties

The following properties are available when instantiating an Update builder.

| Property | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table to update |
| `engine` | `Engine` | The database engine instance |

### Methods

The following methods are available when using an Update builder.

#### Setting Values

The following example shows how to set field values for updates.

```typescript
// Update single field
await engine.update('users')
  .set({ last_login: new Date() })
  .where('id = ?', [userId]);

// Update multiple fields
await engine.update('products')
  .set({
    price: 899.99,
    stock_quantity: 25,
    updated_at: new Date(),
    description: 'Updated product description'
  })
  .where('id = ?', [productId]);

// Update with expressions
await engine.update('posts')
  .set({
    view_count: 'view_count + 1',
    last_viewed: new Date()
  })
  .where('id = ?', [postId]);

// Update with NULL values
await engine.update('users')
  .set({
    phone: null,
    address: null,
    updated_at: new Date()
  })
  .where('active = ?', [false]);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `values` | `object` | Object containing field names and their new values |

**Returns**

The Update builder instance to allow method chaining.

#### Where Conditions

The following example shows how to add WHERE conditions to specify which records to update.

```typescript
// Update specific record
await engine.update('users')
  .set({ active: false })
  .where('id = ?', [userId]);

// Update with multiple conditions
await engine.update('posts')
  .set({ published: true, published_at: new Date() })
  .where('status = ?', ['draft'])
  .where('user_id = ?', [authorId])
  .where('created_at > ?', [new Date('2024-01-01')]);

// Update with OR conditions
await engine.update('users')
  .set({ notification_enabled: false })
  .where('last_login < ?', [new Date('2023-01-01')])
  .orWhere('active = ?', [false]);

// Update with complex conditions
await engine.update('orders')
  .set({ status: 'cancelled' })
  .where('status IN (?)', [['pending', 'processing']])
  .where('created_at < ?', [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]); // 30 days ago

// Update with LIKE conditions
await engine.update('users')
  .set({ role: 'user' })
  .where('email LIKE ?', ['%@temp.com']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `condition` | `string` | SQL condition with ? placeholders |
| `values` | `any[]` | Values to replace placeholders |

**Returns**

The Update builder instance to allow method chaining.

#### Joins (MySQL/PostgreSQL)

The following example shows how to update records using JOIN operations.

```typescript
// Update with INNER JOIN
await engine.update('posts p')
  .innerJoin('users u', 'p.user_id = u.id')
  .set({ 'p.featured': true })
  .where('u.role = ?', ['premium']);

// Update with LEFT JOIN
await engine.update('orders o')
  .leftJoin('customers c', 'o.customer_id = c.id')
  .set({ 
    'o.status': 'verified',
    'o.verified_at': new Date()
  })
  .where('c.verified = ?', [true])
  .where('o.status = ?', ['pending']);

// Update with multiple joins
await engine.update('order_items oi')
  .innerJoin('orders o', 'oi.order_id = o.id')
  .innerJoin('products p', 'oi.product_id = p.id')
  .set({ 'oi.discount_applied': true })
  .where('o.customer_type = ?', ['vip'])
  .where('p.category = ?', ['electronics']);

// Update with subquery in JOIN
await engine.update('users u')
  .innerJoin('(SELECT user_id, COUNT(*) as post_count FROM posts GROUP BY user_id) pc', 'u.id = pc.user_id')
  .set({ 'u.badge': 'prolific_writer' })
  .where('pc.post_count > ?', [100]);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table to join with optional alias |
| `condition` | `string` | Join condition |
| `values` | `any[]` | Values for join condition placeholders (optional) |

**Returns**

The Update builder instance to allow method chaining.

#### Returning Updated Values (PostgreSQL)

The following example shows how to return updated values.

```typescript
// Return all columns of updated records
const updatedUsers = await engine.update('users')
  .set({ active: false, deactivated_at: new Date() })
  .where('last_login < ?', [cutoffDate])
  .returning('*');

console.log(`Deactivated ${updatedUsers.length} users`);

// Return specific columns
const updatedPosts = await engine.update('posts')
  .set({ published: true, published_at: new Date() })
  .where('status = ?', ['approved'])
  .returning(['id', 'title', 'published_at']);

// Return computed values
const priceUpdates = await engine.update('products')
  .set({ price: 'price * 1.1' }) // 10% price increase
  .where('category = ?', ['electronics'])
  .returning(['id', 'name', 'price', 'price * 0.9 as discounted_price']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | Column names or expressions to return |

**Returns**

The Update builder instance to allow method chaining.

#### Limiting Updates (MySQL)

The following example shows how to limit the number of updated records.

```typescript
// Update only first 10 matching records
await engine.update('users')
  .set({ processed: true })
  .where('status = ?', ['pending'])
  .orderBy('created_at', 'ASC')
  .limit(10);

// Update with ORDER BY and LIMIT
await engine.update('posts')
  .set({ featured: false })
  .where('featured = ?', [true])
  .orderBy('created_at', 'ASC')
  .limit(5); // Unfeature oldest 5 featured posts
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `count` | `number` | Maximum number of rows to update |

**Returns**

The Update builder instance to allow method chaining.

#### Getting Query Information

The following example shows how to inspect the generated SQL before execution.

```typescript
const updateBuilder = engine.update('users')
  .set({ active: false })
  .where('last_login < ?', [new Date('2023-01-01')]);

const { query, values } = updateBuilder.query();
console.log('SQL:', query);
console.log('Values:', values);

// Then execute
await updateBuilder;
```

**Returns**

An object containing the SQL query string and parameter values.

### Common Update Patterns

#### Conditional Updates

```typescript
// Update based on current values
await engine.update('users')
  .set({
    status: 'inactive',
    deactivated_at: new Date()
  })
  .where('last_login < ?', [new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)])
  .where('status = ?', ['active']);

// Update with CASE statements
await engine.update('products')
  .set({
    status: `CASE 
      WHEN stock_quantity = 0 THEN 'out_of_stock'
      WHEN stock_quantity < 10 THEN 'low_stock'
      ELSE 'in_stock'
    END`,
    updated_at: new Date()
  })
  .where('category = ?', ['electronics']);
```

#### Bulk Updates

```typescript
// Update multiple records with same values
await engine.update('posts')
  .set({
    published: true,
    published_at: new Date(),
    updated_at: new Date()
  })
  .where('status = ?', ['approved'])
  .where('scheduled_for <= ?', [new Date()]);

// Update with calculated values
await engine.update('order_items')
  .set({
    total_price: 'quantity * unit_price',
    updated_at: new Date()
  })
  .where('total_price IS NULL');
```

#### Incremental Updates

```typescript
// Increment counters
await engine.update('posts')
  .set({
    view_count: 'view_count + 1',
    last_viewed: new Date()
  })
  .where('id = ?', [postId]);

// Decrement inventory
await engine.update('products')
  .set({
    stock_quantity: 'stock_quantity - ?',
    updated_at: new Date()
  }, [quantityOrdered])
  .where('id = ?', [productId])
  .where('stock_quantity >= ?', [quantityOrdered]);

// Update with mathematical operations
await engine.update('user_stats')
  .set({
    total_points: 'total_points + ?',
    level: 'FLOOR(total_points / 1000) + 1',
    updated_at: new Date()
  }, [pointsEarned])
  .where('user_id = ?', [userId]);
```

#### Status Transitions

```typescript
// State machine updates
await engine.update('orders')
  .set({
    status: 'shipped',
    shipped_at: new Date(),
    tracking_number: 'TRK123456789',
    updated_at: new Date()
  })
  .where('status = ?', ['processing'])
  .where('payment_status = ?', ['completed']);

// Workflow updates
await engine.update('documents')
  .set({
    status: 'approved',
    approved_by: userId,
    approved_at: new Date(),
    next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  })
  .where('status = ?', ['pending_approval'])
  .where('submitted_at <= ?', [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]); // 7 days ago
```

### Database-Specific Features

#### MySQL Features

```typescript
// MySQL-specific functions
await engine.update('users')
  .set({
    full_name: 'CONCAT(first_name, " ", last_name)',
    updated_at: 'NOW()',
    metadata: 'JSON_SET(metadata, "$.last_update", NOW())'
  })
  .where('full_name IS NULL');

// Update with MySQL date functions
await engine.update('subscriptions')
  .set({
    expires_at: 'DATE_ADD(created_at, INTERVAL 1 YEAR)',
    status: 'active'
  })
  .where('status = ?', ['pending']);

// Update with LIMIT (MySQL)
await engine.update('queue_jobs')
  .set({
    status: 'processing',
    started_at: new Date(),
    worker_id: workerId
  })
  .where('status = ?', ['pending'])
  .orderBy('priority', 'DESC')
  .orderBy('created_at', 'ASC')
  .limit(5);
```

#### PostgreSQL Features

```typescript
// PostgreSQL-specific functions
await engine.update('users')
  .set({
    full_name: 'first_name || \' \' || last_name',
    updated_at: 'NOW()',
    metadata: 'metadata || \'{"last_update": "now"}\'::jsonb'
  })
  .where('full_name IS NULL')
  .returning('*');

// Update with PostgreSQL array operations
await engine.update('posts')
  .set({
    tags: 'array_append(tags, ?)',
    updated_at: 'NOW()'
  }, ['featured'])
  .where('featured = ?', [true])
  .where('NOT ? = ANY(tags)', ['featured']);

// Update with window functions
await engine.update('employees')
  .set({
    rank: `(
      SELECT ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC)
      FROM employees e2 
      WHERE e2.id = employees.id
    )`
  })
  .where('department IS NOT NULL');
```

#### SQLite Features

```typescript
// SQLite-specific considerations
await engine.update('users')
  .set({
    active: 1, // Boolean as INTEGER
    full_name: 'first_name || " " || last_name',
    updated_at: 'datetime("now")'
  })
  .where('active = ?', [0]);

// Update with SQLite date functions
await engine.update('sessions')
  .set({
    expires_at: 'datetime(created_at, "+30 days")',
    updated_at: 'datetime("now")'
  })
  .where('expires_at IS NULL');
```

### Type Safety

The Update builder supports TypeScript generics for type-safe operations:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  last_login?: Date;
  updated_at: Date;
};

type UserUpdate = Partial<Omit<User, 'id'>>; // Exclude ID from updates

// Type-safe update
const updateData: UserUpdate = {
  active: false,
  updated_at: new Date()
};

const updatedUsers: User[] = await engine.update<User>('users')
  .set(updateData)
  .where('last_login < ?', [cutoffDate])
  .returning('*');

// Type-safe with specific fields
const emailUpdate: Pick<User, 'email' | 'updated_at'> = {
  email: 'newemail@example.com',
  updated_at: new Date()
};

await engine.update<User>('users')
  .set(emailUpdate)
  .where('id = ?', [userId]);
```

### Error Handling

The Update builder uses consistent error handling through the `InquireException`:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await engine.update('users')
    .set({ email: 'invalid-email' })
    .where('id = ?', [userId]);
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Update error:', error.message);
    
    // Handle specific error types
    if (error.message.includes('constraint')) {
      console.log('Constraint violation during update');
    } else if (error.message.includes('duplicate')) {
      console.log('Duplicate value during update');
    }
  }
}
```

### Performance Considerations

#### Index Usage

```typescript
// Ensure WHERE conditions use indexed columns
await engine.update('users')
  .set({ last_seen: new Date() })
  .where('id = ?', [userId]); // ID is typically indexed

// Use compound indexes effectively
await engine.update('posts')
  .set({ featured: true })
  .where('user_id = ?', [authorId])
  .where('status = ?', ['published']); // If there's an index on (user_id, status)
```

#### Batch Updates

```typescript
// Update in batches for large datasets
const updateInBatches = async (userIds: number[], batchSize = 1000) => {
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    await engine.update('users')
      .set({ processed: true, updated_at: new Date() })
      .where('id IN (?)', [batch]);
  }
};

await updateInBatches(largeUserIdArray);
```

#### Transaction Usage

```typescript
// Use transactions for related updates
await engine.transaction(async (trx) => {
  // Update order status
  await trx.update('orders')
    .set({ 
      status: 'completed',
      completed_at: new Date()
    })
    .where('id = ?', [orderId]);
  
  // Update inventory
  await trx.update('products')
    .set({ stock_quantity: 'stock_quantity - ?' }, [quantity])
    .where('id = ?', [productId]);
  
  // Update user points
  await trx.update('users')
    .set({ points: 'points + ?' }, [earnedPoints])
    .where('id = ?', [userId]);
});
```

### Complete Example

Here's a comprehensive example showing various update patterns:

```typescript
type Order = {
  id: number;
  customer_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address: string;
  tracking_number?: string;
  shipped_at?: Date;
  delivered_at?: Date;
  updated_at: Date;
};

// Complex order processing update
const processOrders = async () => {
  return await engine.transaction(async (trx) => {
    // Update orders to processing status
    const processingOrders = await trx.update<Order>('orders')
      .set({
        status: 'processing',
        updated_at: new Date()
      })
      .where('status = ?', ['pending'])
      .where('payment_status = ?', ['completed'])
      .where('created_at <= ?', [new Date(Date.now() - 60 * 60 * 1000)]) // 1 hour ago
      .returning(['id', 'customer_id', 'total_amount']);
    
    // Update customer statistics
    if (processingOrders.length > 0) {
      const customerIds = [...new Set(processingOrders.map(o => o.customer_id))];
      
      await trx.update('customers')
        .set({
          total_orders: 'total_orders + 1',
          total_spent: `total_spent + (
            SELECT SUM(total_amount) 
            FROM orders 
            WHERE customer_id = customers.id 
            AND status = 'processing'
            AND updated_at >= ?
          )`,
          last_order_date: new Date(),
          updated_at: new Date()
        }, [new Date(Date.now() - 60 * 60 * 1000)])
        .where('id IN (?)', [customerIds]);
    }
    
    // Update inventory for processing orders
    await trx.update('products p')
      .innerJoin('order_items oi', 'p.id = oi.product_id')
      .innerJoin('orders o', 'oi.order_id = o.id')
      .set({
        'p.reserved_quantity': 'p.reserved_quantity + oi.quantity',
        'p.available_quantity': 'p.available_quantity - oi.quantity',
        'p.updated_at': new Date()
      })
      .where('o.status = ?', ['processing'])
      .where('o.updated_at >= ?', [new Date(Date.now() - 60 * 60 * 1000)]);
    
    // Log the processing
    await trx.insert('order_status_log')
      .values(processingOrders.map(order => ({
        order_id: order.id,
        old_status: 'pending',
        new_status: 'processing',
        changed_by: 'system',
        changed_at: new Date(),
        notes: 'Automatically processed after payment confirmation'
      })));
    
    return {
      processedCount: processingOrders.length,
      orderIds: processingOrders.map(o => o.id)
    };
  });
};

// Usage
const result = await processOrders();
console.log(`Processed ${result.processedCount} orders`);
```

## MySQL Dialect

MySQL-specific SQL dialect implementation for converting query builders to MySQL-compatible SQL statements with proper syntax, data types, and features.

```typescript
import { Mysql } from '@stackpress/inquire';
import Engine from '@stackpress/inquire';

// Using MySQL dialect directly
const engine = new Engine(connection, Mysql);

// Or access through engine
const { query, values } = engine.select().from('users').query(Mysql);
```

### Properties

The following properties are available in the MySQL dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for identifiers (backtick: `) |

### Static Properties

The following properties can be accessed directly from the MySQL dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for MySQL identifiers (`) |
| `typemap` | `Record<string, string>` | Mapping of generic types to MySQL-specific types |

### Methods

The following methods are available in the MySQL dialect for converting query builders to SQL.

#### Converting ALTER Queries

The following example shows how the MySQL dialect converts ALTER table operations.

```typescript
const alterBuilder = engine.alter('users')
  .addField('email', { type: 'varchar', length: 255, nullable: false })
  .dropField('old_column')
  .addIndex('email_idx', ['email']);

const queries = Mysql.alter(alterBuilder);
// Returns array of query objects with MySQL-specific syntax
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Alter` | Alter query builder instance |

**Returns**

An array of query objects with MySQL ALTER TABLE syntax.

#### Converting CREATE Queries

The following example shows how the MySQL dialect converts CREATE table operations.

```typescript
const createBuilder = engine.create('users')
  .field('id', { type: 'int', length: 11, autoIncrement: true })
  .field('name', { type: 'varchar', length: 255, nullable: false })
  .field('email', { type: 'varchar', length: 255, nullable: false })
  .primary('id')
  .unique('email_unique', ['email']);

const queries = Mysql.create(createBuilder);
// Returns array with MySQL CREATE TABLE syntax
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Create` | Create query builder instance |

**Returns**

An array of query objects with MySQL CREATE TABLE syntax.

#### Converting DELETE Queries

The following example shows how the MySQL dialect converts DELETE operations.

```typescript
const deleteBuilder = engine.delete('users')
  .where('active = ?', [false])
  .where('last_login < ?', ['2023-01-01']);

const { query, values } = Mysql.delete(deleteBuilder);
// Returns: DELETE FROM `users` WHERE active = ? AND last_login = ?
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Delete` | Delete query builder instance |

**Returns**

A query object with MySQL DELETE syntax and parameter values.

#### Converting INSERT Queries

The following example shows how the MySQL dialect converts INSERT operations.

```typescript
const insertBuilder = engine.insert('users').values([
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' }
]);

const { query, values } = Mysql.insert(insertBuilder);
// Returns: INSERT INTO `users` (`name`, `email`) VALUES (?, ?), (?, ?)
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Insert` | Insert query builder instance |

**Returns**

A query object with MySQL INSERT syntax and parameter values.

#### Converting SELECT Queries

The following example shows how the MySQL dialect converts SELECT operations.

```typescript
const selectBuilder = engine.select('u.id', 'u.name', 'p.title')
  .from('users', 'u')
  .leftJoin('posts', 'p', 'u.id', 'p.author_id')
  .where('u.active = ?', [true])
  .orderBy('u.name', 'ASC')
  .limit(10);

const { query, values } = Mysql.select(selectBuilder);
// Returns MySQL SELECT with proper backtick quoting and JOIN syntax
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Select` | Select query builder instance |

**Returns**

A query object with MySQL SELECT syntax and parameter values.

#### Converting UPDATE Queries

The following example shows how the MySQL dialect converts UPDATE operations.

```typescript
const updateBuilder = engine.update('users')
  .set({ name: 'Updated Name', email: 'new@example.com' })
  .where('id = ?', [123]);

const { query, values } = Mysql.update(updateBuilder);
// Returns: UPDATE `users` SET `name` = ?, `email` = ? WHERE id = ?
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Update` | Update query builder instance |

**Returns**

A query object with MySQL UPDATE syntax and parameter values.

#### Dropping Tables

The following example shows how to generate DROP TABLE statements.

```typescript
const { query, values } = Mysql.drop('users');
// Returns: DROP TABLE IF EXISTS `users`
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table name to drop |

**Returns**

A query object with MySQL DROP TABLE syntax.

#### Renaming Tables

The following example shows how to generate RENAME TABLE statements.

```typescript
const { query, values } = Mysql.rename('old_users', 'users');
// Returns: RENAME TABLE `old_users` TO `users`
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `from` | `string` | Current table name |
| `to` | `string` | New table name |

**Returns**

A query object with MySQL RENAME TABLE syntax.

#### Truncating Tables

The following example shows how to generate TRUNCATE TABLE statements.

```typescript
const { query, values } = Mysql.truncate('users');
// Returns: TRUNCATE TABLE `users`

const { query, values } = Mysql.truncate('users', true);
// Returns: TRUNCATE TABLE `users` CASCADE
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table name to truncate |
| `cascade` | `boolean` | Whether to use CASCADE option (default: false) |

**Returns**

A query object with MySQL TRUNCATE TABLE syntax.

### MySQL-Specific Features

#### Data Type Mapping

The MySQL dialect provides comprehensive type mapping for common data types.

```typescript
// Type mapping examples
const typemap = {
  object: 'JSON',        // Objects stored as JSON
  hash: 'JSON',          // Hash objects as JSON
  json: 'JSON',          // Explicit JSON type
  char: 'CHAR',          // Fixed-length strings
  string: 'VARCHAR',     // Variable-length strings
  varchar: 'VARCHAR',    // Explicit VARCHAR
  text: 'TEXT',          // Large text fields
  bool: 'BOOLEAN',       // Boolean values
  boolean: 'BOOLEAN',    // Explicit boolean
  number: 'INT',         // Numeric values
  int: 'INT',            // Integers
  integer: 'INT',        // Explicit integer
  float: 'FLOAT',        // Floating point numbers
  date: 'DATE',          // Date values
  datetime: 'DATETIME',  // Date and time values
  time: 'TIME'           // Time values
};

// Automatic type inference
engine.create('users')
  .field('id', { type: 'int', length: 11 })        // Becomes INT(11)
  .field('name', { type: 'varchar', length: 255 }) // Becomes VARCHAR(255)
  .field('active', { type: 'boolean' })            // Becomes BOOLEAN
  .field('data', { type: 'json' });                // Becomes JSON
```

#### Integer Type Optimization

The MySQL dialect automatically optimizes integer types based on length.

```typescript
// Automatic integer type selection
engine.create('users')
  .field('flag', { type: 'int', length: 1 })    // Becomes TINYINT
  .field('id', { type: 'int', length: 11 })     // Becomes INT
  .field('big_id', { type: 'int', length: 20 }) // Becomes BIGINT
  .field('count', { type: 'int' });             // Becomes INT(11) - default
```

#### Field Attributes

MySQL dialect supports various field attributes and constraints.

```typescript
engine.create('users')
  .field('id', { 
    type: 'int', 
    length: 11, 
    autoIncrement: true,
    nullable: false 
  })
  .field('score', { 
    type: 'int', 
    unsigned: true,
    default: 0 
  })
  .field('name', { 
    type: 'varchar', 
    length: 255,
    nullable: false,
    attribute: 'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
  })
  .field('created_at', { 
    type: 'datetime',
    default: 'NOW()'
  });
```

#### Index and Constraint Support

MySQL dialect provides comprehensive support for indexes and constraints.

```typescript
engine.create('users')
  .field('id', { type: 'int', autoIncrement: true })
  .field('email', { type: 'varchar', length: 255 })
  .field('username', { type: 'varchar', length: 50 })
  .field('category_id', { type: 'int' })
  .primary('id')                                    // PRIMARY KEY
  .unique('email_unique', ['email'])                // UNIQUE KEY
  .key('username_idx', ['username'])                // INDEX
  .foreign('fk_category', 'category_id', 'categories', 'id', {
    delete: 'CASCADE',
    update: 'RESTRICT'
  });
```

#### JOIN Support

MySQL dialect supports all standard JOIN types with proper syntax.

```typescript
const { query } = engine.select('u.*', 'p.title')
  .from('users', 'u')
  .innerJoin('posts', 'p', 'u.id', 'p.author_id')
  .leftJoin('categories', 'c', 'p.category_id', 'c.id')
  .rightJoin('tags', 't', 'p.id', 't.post_id')
  .query(Mysql);

// Generates:
// SELECT u.*, p.title 
// FROM `users` AS `u`
// INNER JOIN `posts` AS `p` ON (`u`.`id` = `p`.`author_id`)
// LEFT JOIN `categories` AS `c` ON (`p`.`category_id` = `c`.`id`)
// RIGHT JOIN `tags` AS `t` ON (`p`.`id` = `t`.`post_id`)
```

#### Identifier Quoting

MySQL dialect uses backticks for identifier quoting to handle reserved words and special characters.

```typescript
// All identifiers are properly quoted
const { query } = engine.select('order', 'group', 'select')
  .from('user-table')
  .where('`order` = ?', [1])
  .query(Mysql);

// Generates: SELECT `order`, `group`, `select` FROM `user-table` WHERE `order` = ?
```

### Advanced MySQL Features

#### Multi-Table Operations

MySQL supports advanced multi-table operations that can be used with raw SQL.

```typescript
// Multi-table DELETE
await engine.sql`
  DELETE u, p 
  FROM users u 
  LEFT JOIN posts p ON u.id = p.author_id 
  WHERE u.active = ${[false]}
`;

// Multi-table UPDATE
await engine.sql`
  UPDATE users u 
  JOIN posts p ON u.id = p.author_id 
  SET u.post_count = u.post_count + 1, p.updated_at = NOW()
  WHERE p.status = ${'published'}
`;
```

#### MySQL-Specific Functions

Leverage MySQL-specific functions and features.

```typescript
// JSON functions
await engine.sql`
  SELECT JSON_EXTRACT(data, '$.name') as name
  FROM users 
  WHERE JSON_CONTAINS(data, ${'{"active": true}'})
`;

// Full-text search
await engine.sql`
  SELECT *, MATCH(title, content) AGAINST(${['search term']} IN NATURAL LANGUAGE MODE) as relevance
  FROM posts 
  WHERE MATCH(title, content) AGAINST(${['search term']} IN NATURAL LANGUAGE MODE)
  ORDER BY relevance DESC
`;

// Window functions (MySQL 8.0+)
await engine.sql`
  SELECT 
    name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) as rank
  FROM employees
`;
```

#### Storage Engine Options

MySQL dialect can be extended for storage engine specific features.

```typescript
// Using raw SQL for storage engine options
await engine.sql`
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

// Partitioning (MySQL specific)
await engine.sql`
  CREATE TABLE logs (
    id INT AUTO_INCREMENT,
    created_at DATE,
    message TEXT,
    PRIMARY KEY (id, created_at)
  ) PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025)
  )
`;
```

### Error Handling

MySQL dialect handles MySQL-specific error conditions and constraints.

```typescript
try {
  await engine.insert('users').values({ email: 'duplicate@example.com' });
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    console.error('Duplicate entry for unique constraint');
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    console.error('Foreign key constraint violation');
  } else if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    console.error('Cannot delete: row is referenced by foreign key');
  }
}
```

### Performance Considerations

#### Query Optimization

MySQL dialect generates optimized queries for better performance.

```typescript
// Efficient use of indexes
await engine.select()
  .from('users')
  .where('status = ?', ['active'])    // Use indexed column first
  .where('created_at > ?', ['2023-01-01'])
  .orderBy('created_at', 'DESC')      // Order by indexed column
  .limit(100);

// Avoid SELECT * when possible
await engine.select('id', 'name', 'email')  // Specify needed columns
  .from('users')
  .where('active = ?', [true]);
```

#### Bulk Operations

Use MySQL-specific bulk operation patterns for better performance.

```typescript
// Bulk INSERT with ON DUPLICATE KEY UPDATE
await engine.sql`
  INSERT INTO user_stats (user_id, login_count, last_login)
  VALUES ${users.map(u => `(${u.id}, 1, NOW())`).join(', ')}
  ON DUPLICATE KEY UPDATE 
    login_count = login_count + 1,
    last_login = NOW()
`;

// Bulk UPDATE with CASE statements
await engine.sql`
  UPDATE users 
  SET status = CASE 
    WHEN id IN (${activeIds.join(',')}) THEN 'active'
    WHEN id IN (${inactiveIds.join(',')}) THEN 'inactive'
    ELSE status
  END
  WHERE id IN (${[...activeIds, ...inactiveIds].join(',')})
`;
```

The MySQL dialect provides comprehensive support for MySQL-specific features while maintaining compatibility with the Inquire query builder system, ensuring optimal performance and proper SQL generation for MySQL databases.

## PostgreSQL Dialect

PostgreSQL-specific SQL dialect implementation for converting query builders to PostgreSQL-compatible SQL statements with proper syntax, data types, and advanced features.

```typescript
import { Pgsql } from '@stackpress/inquire';
import Engine from '@stackpress/inquire';

// Using PostgreSQL dialect directly
const engine = new Engine(connection, Pgsql);

// Or access through engine
const { query, values } = engine.select().from('users').query(Pgsql);
```

### Properties

The following properties are available in the PostgreSQL dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for identifiers (double quote: ") |

### Static Properties

The following properties can be accessed directly from the PostgreSQL dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for PostgreSQL identifiers (") |
| `typemap` | `Record<string, string>` | Mapping of generic types to PostgreSQL-specific types |

### Methods

The following methods are available in the PostgreSQL dialect for converting query builders to SQL.

#### Converting ALTER Queries

The following example shows how the PostgreSQL dialect converts ALTER table operations.

```typescript
const alterBuilder = engine.alter('users')
  .addField('email', { type: 'varchar', length: 255, nullable: false })
  .dropField('old_column')
  .addIndex('email_idx', ['email']);

const queries = Pgsql.alter(alterBuilder);
// Returns array of query objects with PostgreSQL-specific syntax
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Alter` | Alter query builder instance |

**Returns**

An array of query objects with PostgreSQL ALTER TABLE syntax.

#### Converting CREATE Queries

The following example shows how the PostgreSQL dialect converts CREATE table operations.

```typescript
const createBuilder = engine.create('users')
  .field('id', { type: 'int', autoIncrement: true })
  .field('name', { type: 'varchar', length: 255, nullable: false })
  .field('email', { type: 'varchar', length: 255, nullable: false })
  .primary('id')
  .unique('email_unique', ['email']);

const queries = Pgsql.create(createBuilder);
// Returns array with PostgreSQL CREATE TABLE syntax and separate INDEX statements
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Create` | Create query builder instance |

**Returns**

An array of query objects with PostgreSQL CREATE TABLE syntax and separate CREATE INDEX statements.

#### Converting DELETE Queries

The following example shows how the PostgreSQL dialect converts DELETE operations.

```typescript
const deleteBuilder = engine.delete('users')
  .where('active = ?', [false])
  .where('last_login < ?', ['2023-01-01']);

const { query, values } = Pgsql.delete(deleteBuilder);
// Returns: DELETE FROM "users" WHERE active = ? AND last_login = ?
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Delete` | Delete query builder instance |

**Returns**

A query object with PostgreSQL DELETE syntax and parameter values.

#### Converting INSERT Queries

The following example shows how the PostgreSQL dialect converts INSERT operations with RETURNING support.

```typescript
const insertBuilder = engine.insert('users')
  .values([
    { name: 'John', email: 'john@example.com' },
    { name: 'Jane', email: 'jane@example.com' }
  ])
  .returning('id', 'name');

const { query, values } = Pgsql.insert(insertBuilder);
// Returns: INSERT INTO "users" ("name", "email") VALUES (?, ?), (?, ?) RETURNING "id", "name"
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Insert` | Insert query builder instance |

**Returns**

A query object with PostgreSQL INSERT syntax, parameter values, and optional RETURNING clause.

#### Converting SELECT Queries

The following example shows how the PostgreSQL dialect converts SELECT operations.

```typescript
const selectBuilder = engine.select('u.id', 'u.name', 'p.title')
  .from('users', 'u')
  .leftJoin('posts', 'p', 'u.id', 'p.author_id')
  .where('u.active = ?', [true])
  .orderBy('u.name', 'ASC')
  .limit(10);

const { query, values } = Pgsql.select(selectBuilder);
// Returns PostgreSQL SELECT with proper double quote quoting and JOIN syntax
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Select` | Select query builder instance |

**Returns**

A query object with PostgreSQL SELECT syntax and parameter values.

#### Converting UPDATE Queries

The following example shows how the PostgreSQL dialect converts UPDATE operations.

```typescript
const updateBuilder = engine.update('users')
  .set({ name: 'Updated Name', email: 'new@example.com' })
  .where('id = ?', [123]);

const { query, values } = Pgsql.update(updateBuilder);
// Returns: UPDATE "users" SET "name" = ?, "email" = ? WHERE id = ?
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Update` | Update query builder instance |

**Returns**

A query object with PostgreSQL UPDATE syntax and parameter values.

#### Dropping Tables

The following example shows how to generate DROP TABLE statements.

```typescript
const { query, values } = Pgsql.drop('users');
// Returns: DROP TABLE IF EXISTS "users"
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table name to drop |

**Returns**

A query object with PostgreSQL DROP TABLE syntax.

#### Renaming Tables

The following example shows how to generate RENAME TABLE statements.

```typescript
const { query, values } = Pgsql.rename('old_users', 'users');
// Returns: RENAME TABLE "old_users" TO "users"
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `from` | `string` | Current table name |
| `to` | `string` | New table name |

**Returns**

A query object with PostgreSQL RENAME TABLE syntax.

#### Truncating Tables

The following example shows how to generate TRUNCATE TABLE statements.

```typescript
const { query, values } = Pgsql.truncate('users');
// Returns: TRUNCATE TABLE "users"

const { query, values } = Pgsql.truncate('users', true);
// Returns: TRUNCATE TABLE "users" CASCADE
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table name to truncate |
| `cascade` | `boolean` | Whether to use CASCADE option (default: false) |

**Returns**

A query object with PostgreSQL TRUNCATE TABLE syntax.

### PostgreSQL-Specific Features

#### Data Type Mapping

The PostgreSQL dialect provides comprehensive type mapping optimized for PostgreSQL data types.

```typescript
// Type mapping examples
const typemap = {
  object: 'JSONB',       // Objects stored as JSONB (binary JSON)
  hash: 'JSONB',         // Hash objects as JSONB
  json: 'JSONB',         // Explicit JSONB type
  char: 'CHAR',          // Fixed-length strings
  string: 'VARCHAR',     // Variable-length strings
  varchar: 'VARCHAR',    // Explicit VARCHAR
  text: 'TEXT',          // Large text fields
  bool: 'BOOLEAN',       // Boolean values
  boolean: 'BOOLEAN',    // Explicit boolean
  number: 'INTEGER',     // Numeric values
  int: 'INTEGER',        // Integers
  integer: 'INTEGER',    // Explicit integer
  float: 'DECIMAL',      // Decimal numbers (more precise than FLOAT)
  date: 'DATE',          // Date values
  datetime: 'TIMESTAMP', // Date and time values
  time: 'TIME'           // Time values
};

// Automatic type inference
engine.create('users')
  .field('id', { type: 'int', autoIncrement: true }) // Becomes SERIAL
  .field('name', { type: 'varchar', length: 255 })   // Becomes VARCHAR(255)
  .field('active', { type: 'boolean' })              // Becomes BOOLEAN
  .field('data', { type: 'json' });                  // Becomes JSONB
```

#### Serial Types and Auto-Increment

PostgreSQL dialect automatically converts auto-increment fields to SERIAL types.

```typescript
// Automatic SERIAL type selection
engine.create('users')
  .field('id', { type: 'int', autoIncrement: true })     // Becomes SERIAL
  .field('big_id', { type: 'int', length: 20, autoIncrement: true }) // Becomes BIGSERIAL
  .field('small_id', { type: 'int', length: 1, autoIncrement: true }); // Becomes SMALLSERIAL
```

#### Default Value Handling

PostgreSQL dialect provides intelligent default value conversion.

```typescript
engine.create('users')
  .field('id', { type: 'int', autoIncrement: true })
  .field('active', { type: 'boolean', default: true })        // DEFAULT TRUE
  .field('score', { type: 'int', default: 0 })                // DEFAULT 0
  .field('created_at', { type: 'datetime', default: 'now()' }) // DEFAULT CURRENT_TIMESTAMP
  .field('data', { type: 'json', default: {} });              // DEFAULT '{}'
```

#### RETURNING Clause Support

PostgreSQL dialect supports the RETURNING clause for INSERT, UPDATE, and DELETE operations.

```typescript
// INSERT with RETURNING
const insertBuilder = engine.insert('users')
  .values({ name: 'John', email: 'john@example.com' })
  .returning('id', 'created_at');

// UPDATE with RETURNING (using raw SQL)
const updatedUsers = await engine.sql`
  UPDATE users 
  SET last_login = CURRENT_TIMESTAMP 
  WHERE active = ${[true]}
  RETURNING id, name, last_login
`;

// DELETE with RETURNING (using raw SQL)
const deletedUsers = await engine.sql`
  DELETE FROM users 
  WHERE active = ${[false]}
  RETURNING id, name
`;
```

#### Index Creation

PostgreSQL dialect creates indexes as separate statements for better control.

```typescript
engine.create('users')
  .field('id', { type: 'int', autoIncrement: true })
  .field('email', { type: 'varchar', length: 255 })
  .field('username', { type: 'varchar', length: 50 })
  .primary('id')
  .unique('email_unique', ['email'])
  .key('username_idx', ['username']);

// Generates:
// 1. CREATE TABLE "users" (...)
// 2. CREATE INDEX "username_idx" ON "users"("username")
```

#### Advanced Constraint Support

PostgreSQL dialect supports comprehensive constraint definitions.

```typescript
engine.create('posts')
  .field('id', { type: 'int', autoIncrement: true })
  .field('title', { type: 'varchar', length: 255, nullable: false })
  .field('user_id', { type: 'int', nullable: false })
  .field('status', { type: 'varchar', length: 20, default: 'draft' })
  .primary('id')
  .foreign('fk_user', 'user_id', 'users', 'id', {
    delete: 'CASCADE',
    update: 'RESTRICT'
  });
```

#### Identifier Quoting

PostgreSQL dialect uses double quotes for identifier quoting to handle reserved words and case sensitivity.

```typescript
// All identifiers are properly quoted
const { query } = engine.select('order', 'group', 'select')
  .from('user_table')
  .where('"order" = ?', [1])
  .query(Pgsql);

// Generates: SELECT "order", "group", "select" FROM "user_table" WHERE "order" = ?
```

### Advanced PostgreSQL Features

#### JSONB Operations

PostgreSQL's JSONB type provides powerful JSON operations.

```typescript
// JSONB queries
await engine.sql`
  SELECT * FROM users 
  WHERE data->>'name' = ${'John'}
`;

// JSONB containment
await engine.sql`
  SELECT * FROM users 
  WHERE data @> ${'{"active": true}'}
`;

// JSONB path queries
await engine.sql`
  SELECT data#>>'{profile,email}' as email
  FROM users 
  WHERE data#>>'{profile,active}' = ${'true'}
`;
```

#### Array Operations

PostgreSQL supports array data types and operations.

```typescript
// Array operations
await engine.sql`
  SELECT * FROM posts 
  WHERE ${['tag1', 'tag2']} && tags
`;

// Array aggregation
await engine.sql`
  SELECT user_id, array_agg(title) as post_titles
  FROM posts 
  GROUP BY user_id
`;
```

#### Common Table Expressions (CTEs)

PostgreSQL supports powerful CTE queries.

```typescript
// Recursive CTE
await engine.sql`
  WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 0 as level
    FROM categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
  )
  SELECT * FROM category_tree ORDER BY level, name
`;

// Data modification CTE
await engine.sql`
  WITH moved_posts AS (
    UPDATE posts 
    SET category_id = ${[2]}
    WHERE category_id = ${[1]}
    RETURNING *
  )
  SELECT count(*) as moved_count FROM moved_posts
`;
```

#### Window Functions

PostgreSQL provides comprehensive window function support.

```typescript
// Ranking functions
await engine.sql`
  SELECT 
    name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) as rank,
    DENSE_RANK() OVER (ORDER BY salary DESC) as dense_rank,
    PERCENT_RANK() OVER (ORDER BY salary DESC) as percent_rank
  FROM employees
`;

// Aggregate window functions
await engine.sql`
  SELECT 
    date,
    amount,
    SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as running_total,
    AVG(amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg
  FROM transactions
  ORDER BY date
`;
```

#### Full-Text Search

PostgreSQL provides built-in full-text search capabilities.

```typescript
// Basic text search
await engine.sql`
  SELECT *, ts_rank(to_tsvector('english', title || ' ' || content), query) as rank
  FROM posts, to_tsquery('english', ${'search & terms'}) query
  WHERE to_tsvector('english', title || ' ' || content) @@ query
  ORDER BY rank DESC
`;

// GIN index for full-text search
await engine.sql`
  CREATE INDEX posts_fts_idx ON posts 
  USING GIN (to_tsvector('english', title || ' ' || content))
`;
```

#### Partitioning

PostgreSQL supports table partitioning for large datasets.

```typescript
// Range partitioning
await engine.sql`
  CREATE TABLE logs (
    id SERIAL,
    created_at DATE NOT NULL,
    message TEXT
  ) PARTITION BY RANGE (created_at)
`;

await engine.sql`
  CREATE TABLE logs_2023 PARTITION OF logs
  FOR VALUES FROM ('2023-01-01') TO ('2024-01-01')
`;

await engine.sql`
  CREATE TABLE logs_2024 PARTITION OF logs
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01')
`;
```

### Error Handling

PostgreSQL dialect handles PostgreSQL-specific error conditions and constraints.

```typescript
try {
  await engine.insert('users').values({ email: 'duplicate@example.com' });
} catch (error) {
  if (error.code === '23505') {
    console.error('Unique constraint violation');
  } else if (error.code === '23503') {
    console.error('Foreign key constraint violation');
  } else if (error.code === '23502') {
    console.error('Not null constraint violation');
  } else if (error.code === '42P01') {
    console.error('Table does not exist');
  }
}
```

### Performance Considerations

#### Query Optimization

PostgreSQL dialect generates optimized queries for better performance.

```typescript
// Use indexes effectively
await engine.select()
  .from('users')
  .where('status = ?', ['active'])      // Use indexed column
  .where('created_at > ?', ['2023-01-01'])
  .orderBy('created_at', 'DESC')        // Order by indexed column
  .limit(100);

// Avoid SELECT * when possible
await engine.select('id', 'name', 'email')  // Specify needed columns
  .from('users')
  .where('active = ?', [true]);
```

#### Bulk Operations

Use PostgreSQL-specific bulk operation patterns.

```typescript
// Bulk INSERT with ON CONFLICT
await engine.sql`
  INSERT INTO user_stats (user_id, login_count, last_login)
  VALUES ${users.map(u => `(${u.id}, 1, CURRENT_TIMESTAMP)`).join(', ')}
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    login_count = user_stats.login_count + 1,
    last_login = CURRENT_TIMESTAMP
`;

// Bulk UPDATE with FROM clause
await engine.sql`
  UPDATE users 
  SET status = temp.new_status
  FROM (VALUES 
    ${updates.map(u => `(${u.id}, '${u.status}')`).join(', ')}
  ) AS temp(id, new_status)
  WHERE users.id = temp.id
`;
```

#### Connection Pooling

PostgreSQL works well with connection pooling for better performance.

```typescript
// Use connection pooling for better performance
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'username',
  password: 'password',
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if no connection available
});

const engine = new Engine(pool, Pgsql);
```

The PostgreSQL dialect provides comprehensive support for PostgreSQL-specific features while maintaining compatibility with the Inquire query builder system, ensuring optimal performance and proper SQL generation for PostgreSQL databases.

## SQLite Dialect

SQLite-specific SQL dialect implementation for converting query builders to SQLite-compatible SQL statements with proper syntax, data types, and SQLite-specific features.

```typescript
import { Sqlite } from '@stackpress/inquire';
import Engine from '@stackpress/inquire';

// Using SQLite dialect directly
const engine = new Engine(connection, Sqlite);

// Or access through engine
const { query, values } = engine.select().from('users').query(Sqlite);
```

### Properties

The following properties are available in the SQLite dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for identifiers (backtick: `) |

### Static Properties

The following properties can be accessed directly from the SQLite dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for SQLite identifiers (`) |
| `typemap` | `Record<string, string>` | Mapping of generic types to SQLite-specific types |

### Methods

The following methods are available in the SQLite dialect for converting query builders to SQL.

#### Converting ALTER Queries

The following example shows how the SQLite dialect converts ALTER table operations with SQLite limitations.

```typescript
const alterBuilder = engine.alter('users')
  .addField('email', { type: 'varchar', length: 255, nullable: false })
  .dropField('old_column')
  .addIndex('email_idx', ['email']);

const queries = Sqlite.alter(alterBuilder);
// Returns array of query objects with SQLite-specific syntax
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Alter` | Alter query builder instance |

**Returns**

An array of query objects with SQLite ALTER TABLE syntax and separate INDEX operations.

#### Converting CREATE Queries

The following example shows how the SQLite dialect converts CREATE table operations.

```typescript
const createBuilder = engine.create('users')
  .field('id', { type: 'int', autoIncrement: true })
  .field('name', { type: 'varchar', length: 255, nullable: false })
  .field('email', { type: 'varchar', length: 255, nullable: false })
  .primary('id')
  .unique('email_unique', ['email']);

const queries = Sqlite.create(createBuilder);
// Returns array with SQLite CREATE TABLE syntax and separate INDEX statements
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Create` | Create query builder instance |

**Returns**

An array of query objects with SQLite CREATE TABLE syntax and separate CREATE INDEX statements.

#### Converting DELETE Queries

The following example shows how the SQLite dialect converts DELETE operations.

```typescript
const deleteBuilder = engine.delete('users')
  .where('active = ?', [false])
  .where('last_login < ?', ['2023-01-01']);

const { query, values } = Sqlite.delete(deleteBuilder);
// Returns: DELETE FROM `users` WHERE active = ? AND last_login = ?
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Delete` | Delete query builder instance |

**Returns**

A query object with SQLite DELETE syntax and parameter values.

#### Converting INSERT Queries

The following example shows how the SQLite dialect converts INSERT operations with RETURNING support.

```typescript
const insertBuilder = engine.insert('users')
  .values([
    { name: 'John', email: 'john@example.com' },
    { name: 'Jane', email: 'jane@example.com' }
  ])
  .returning('id', 'name');

const { query, values } = Sqlite.insert(insertBuilder);
// Returns: INSERT INTO `users` (`name`, `email`) VALUES (?, ?), (?, ?) RETURNING `id`, `name`
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Insert` | Insert query builder instance |

**Returns**

A query object with SQLite INSERT syntax, parameter values, and optional RETURNING clause.

#### Converting SELECT Queries

The following example shows how the SQLite dialect converts SELECT operations.

```typescript
const selectBuilder = engine.select('u.id', 'u.name', 'p.title')
  .from('users', 'u')
  .leftJoin('posts', 'p', 'u.id', 'p.author_id')
  .where('u.active = ?', [true])
  .orderBy('u.name', 'ASC')
  .limit(10);

const { query, values } = Sqlite.select(selectBuilder);
// Returns SQLite SELECT with proper backtick quoting and JOIN syntax
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Select` | Select query builder instance |

**Returns**

A query object with SQLite SELECT syntax and parameter values.

#### Converting UPDATE Queries

The following example shows how the SQLite dialect converts UPDATE operations.

```typescript
const updateBuilder = engine.update('users')
  .set({ name: 'Updated Name', email: 'new@example.com' })
  .where('id = ?', [123]);

const { query, values } = Sqlite.update(updateBuilder);
// Returns: UPDATE `users` SET `name` = ?, `email` = ? WHERE id = ?
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `builder` | `Update` | Update query builder instance |

**Returns**

A query object with SQLite UPDATE syntax and parameter values.

#### Dropping Tables

The following example shows how to generate DROP TABLE statements.

```typescript
const { query, values } = Sqlite.drop('users');
// Returns: DROP TABLE IF EXISTS `users`
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table name to drop |

**Returns**

A query object with SQLite DROP TABLE syntax.

#### Renaming Tables

The following example shows how to generate RENAME TABLE statements.

```typescript
const { query, values } = Sqlite.rename('old_users', 'users');
// Returns: ALTER TABLE `old_users` RENAME TO `users`
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `from` | `string` | Current table name |
| `to` | `string` | New table name |

**Returns**

A query object with SQLite RENAME TABLE syntax.

#### Truncating Tables

The following example shows how to generate TRUNCATE TABLE statements.

```typescript
const { query, values } = Sqlite.truncate('users');
// Returns: TRUNCATE TABLE `users`

const { query, values } = Sqlite.truncate('users', true);
// Returns: TRUNCATE TABLE `users` CASCADE
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table name to truncate |
| `cascade` | `boolean` | Whether to use CASCADE option (default: false) |

**Returns**

A query object with SQLite TRUNCATE TABLE syntax.

### SQLite-Specific Features

#### Data Type Mapping

The SQLite dialect provides type mapping optimized for SQLite's dynamic typing system.

```typescript
// Type mapping examples
const typemap = {
  object: 'TEXT',        // Objects stored as JSON strings
  hash: 'TEXT',          // Hash objects as JSON strings
  json: 'TEXT',          // JSON stored as TEXT
  char: 'CHAR',          // Fixed-length strings
  string: 'VARCHAR',     // Variable-length strings
  varchar: 'VARCHAR',    // Explicit VARCHAR
  text: 'TEXT',          // Large text fields
  bool: 'INTEGER',       // Boolean values as 0/1
  boolean: 'INTEGER',    // Explicit boolean as INTEGER
  number: 'INTEGER',     // Numeric values
  int: 'INTEGER',        // Integers
  integer: 'INTEGER',    // Explicit integer
  float: 'REAL',         // Floating point numbers
  date: 'INTEGER',       // Date as Unix timestamp
  datetime: 'INTEGER',   // DateTime as Unix timestamp
  time: 'INTEGER'        // Time as Unix timestamp
};

// Automatic type inference
engine.create('users')
  .field('id', { type: 'int', autoIncrement: true }) // Becomes INTEGER AUTOINCREMENT
  .field('name', { type: 'varchar', length: 255 })   // Becomes VARCHAR(255)
  .field('active', { type: 'boolean' })              // Becomes INTEGER
  .field('data', { type: 'json' });                  // Becomes TEXT
```

#### Boolean Handling

SQLite dialect converts boolean values to integers (0/1) for storage.

```typescript
engine.create('users')
  .field('active', { type: 'boolean', default: true })   // DEFAULT 1
  .field('verified', { type: 'boolean', default: false }) // DEFAULT 0
  .field('premium', { type: 'boolean' });                 // INTEGER type
```

#### Auto-Increment Support

SQLite dialect supports AUTOINCREMENT for primary key fields.

```typescript
engine.create('users')
  .field('id', { type: 'int', autoIncrement: true })  // INTEGER PRIMARY KEY AUTOINCREMENT
  .primary('id');

// Or inline primary key
engine.create('posts')
  .field('id', { type: 'int', autoIncrement: true })  // Automatically becomes PRIMARY KEY
  .field('title', { type: 'varchar', length: 255 });
```

#### Default Value Handling

SQLite dialect provides intelligent default value conversion.

```typescript
engine.create('users')
  .field('id', { type: 'int', autoIncrement: true })
  .field('active', { type: 'boolean', default: true })        // DEFAULT 1
  .field('score', { type: 'int', default: 0 })                // DEFAULT 0
  .field('created_at', { type: 'datetime', default: 'now()' }) // DEFAULT CURRENT_TIMESTAMP
  .field('data', { type: 'text', default: '{}' });            // DEFAULT '{}'
```

#### Index Creation

SQLite dialect creates indexes as separate statements for better control.

```typescript
engine.create('users')
  .field('id', { type: 'int', autoIncrement: true })
  .field('email', { type: 'varchar', length: 255 })
  .field('username', { type: 'varchar', length: 50 })
  .primary('id')
  .unique('email_unique', ['email'])
  .key('username_idx', ['username']);

// Generates:
// 1. CREATE TABLE `users` (...)
// 2. CREATE UNIQUE INDEX `email_unique` ON `users`(`email`)
// 3. CREATE INDEX `username_idx` ON `users`(`username`)
```

#### Foreign Key Support

SQLite dialect supports foreign key constraints when enabled.

```typescript
// Enable foreign key constraints
await engine.sql`PRAGMA foreign_keys = ON`;

engine.create('posts')
  .field('id', { type: 'int', autoIncrement: true })
  .field('title', { type: 'varchar', length: 255 })
  .field('user_id', { type: 'int', nullable: false })
  .primary('id')
  .foreign('fk_user', 'user_id', 'users', 'id', {
    delete: 'CASCADE',
    update: 'RESTRICT'
  });
```

#### Identifier Quoting

SQLite dialect uses backticks for identifier quoting to handle reserved words and special characters.

```typescript
// All identifiers are properly quoted
const { query } = engine.select('order', 'group', 'select')
  .from('user-table')
  .where('`order` = ?', [1])
  .query(Sqlite);

// Generates: SELECT `order`, `group`, `select` FROM `user-table` WHERE `order` = ?
```

### SQLite Limitations and Workarounds

#### ALTER TABLE Limitations

SQLite has several limitations with ALTER TABLE operations that the dialect handles appropriately.

```typescript
// Supported ALTER operations
await engine.alter('users')
  .addField('email', { type: 'varchar', length: 255 })  // ✅ Supported
  .dropField('old_column')                              // ✅ Supported (SQLite 3.35+)
  .addIndex('email_idx', ['email']);                    // ✅ Supported

// Limited ALTER operations (require table recreation)
// - Modifying column constraints (NOT NULL, DEFAULT)
// - Adding/removing PRIMARY KEY constraints
// - Adding/removing FOREIGN KEY constraints
// - Changing column data types (limited support)

// Workaround: Use raw SQL for complex alterations
await engine.sql`
  BEGIN TRANSACTION;
  CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
  );
  INSERT INTO users_new (id, name, email) 
  SELECT id, name, email FROM users;
  DROP TABLE users;
  ALTER TABLE users_new RENAME TO users;
  COMMIT;
`;
```

#### Data Type Flexibility

SQLite's dynamic typing allows flexible data storage.

```typescript
// SQLite allows storing different types in the same column
await engine.insert('flexible_table').values([
  { data: 'string value' },
  { data: 42 },
  { data: JSON.stringify({ key: 'value' }) }
]);

// Use CHECK constraints for type enforcement
await engine.sql`
  CREATE TABLE strict_table (
    id INTEGER PRIMARY KEY,
    email TEXT CHECK (email LIKE '%@%.%'),
    age INTEGER CHECK (age >= 0 AND age <= 150),
    status TEXT CHECK (status IN ('active', 'inactive', 'pending'))
  )
`;
```

### Advanced SQLite Features

#### JSON Operations

SQLite 3.38+ provides JSON functions for working with JSON data.

```typescript
// JSON functions (SQLite 3.38+)
await engine.sql`
  SELECT json_extract(data, '$.name') as name
  FROM users 
  WHERE json_extract(data, '$.active') = 'true'
`;

// JSON aggregation
await engine.sql`
  SELECT json_group_array(name) as user_names
  FROM users 
  WHERE active = 1
`;

// JSON validation
await engine.sql`
  SELECT * FROM users 
  WHERE json_valid(data) = 1
`;
```

#### Full-Text Search

SQLite provides FTS (Full-Text Search) capabilities.

```typescript
// Create FTS virtual table
await engine.sql`
  CREATE VIRTUAL TABLE posts_fts USING fts5(title, content, content='posts', content_rowid='id')
`;

// Populate FTS table
await engine.sql`
  INSERT INTO posts_fts(rowid, title, content) 
  SELECT id, title, content FROM posts
`;

// Full-text search
await engine.sql`
  SELECT posts.* FROM posts_fts 
  JOIN posts ON posts.id = posts_fts.rowid
  WHERE posts_fts MATCH ${'search terms'}
  ORDER BY bm25(posts_fts)
`;
```

#### Common Table Expressions (CTEs)

SQLite supports CTEs for complex queries.

```typescript
// Recursive CTE
await engine.sql`
  WITH RECURSIVE category_tree(id, name, parent_id, level) AS (
    SELECT id, name, parent_id, 0 
    FROM categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
  )
  SELECT * FROM category_tree ORDER BY level, name
`;
```

#### Window Functions

SQLite 3.25+ supports window functions.

```typescript
// Window functions
await engine.sql`
  SELECT 
    name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) as rank,
    LAG(salary) OVER (ORDER BY salary DESC) as prev_salary
  FROM employees
`;

// Aggregate window functions
await engine.sql`
  SELECT 
    date,
    amount,
    SUM(amount) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) as running_total
  FROM transactions
  ORDER BY date
`;
```

#### PRAGMA Statements

SQLite uses PRAGMA statements for configuration.

```typescript
// Enable foreign key constraints
await engine.sql`PRAGMA foreign_keys = ON`;

// Set journal mode
await engine.sql`PRAGMA journal_mode = WAL`;

// Set synchronous mode
await engine.sql`PRAGMA synchronous = NORMAL`;

// Check database integrity
const integrity = await engine.sql`PRAGMA integrity_check`;

// Get table info
const tableInfo = await engine.sql`PRAGMA table_info(users)`;
```

### Error Handling

SQLite dialect handles SQLite-specific error conditions.

```typescript
try {
  await engine.insert('users').values({ email: 'duplicate@example.com' });
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    console.error('Unique constraint violation');
  } else if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    console.error('Foreign key constraint violation');
  } else if (error.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    console.error('Not null constraint violation');
  } else if (error.message.includes('no such table')) {
    console.error('Table does not exist');
  }
}
```

### Performance Considerations

#### Indexing Strategy

SQLite benefits from proper indexing for query performance.

```typescript
// Create indexes for common query patterns
await engine.sql`CREATE INDEX idx_users_email ON users(email)`;
await engine.sql`CREATE INDEX idx_posts_user_id ON posts(user_id)`;
await engine.sql`CREATE INDEX idx_posts_created_at ON posts(created_at)`;

// Composite indexes for multi-column queries
await engine.sql`CREATE INDEX idx_posts_status_date ON posts(status, created_at)`;

// Partial indexes for filtered queries
await engine.sql`CREATE INDEX idx_active_users ON users(email) WHERE active = 1`;
```

#### Transaction Usage

Use transactions for better performance and data consistency.

```typescript
// Batch operations in transactions
const transaction = await engine.transaction();
try {
  for (const user of users) {
    await transaction.insert('users').values(user);
  }
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}

// WAL mode for better concurrency
await engine.sql`PRAGMA journal_mode = WAL`;
```

#### Memory and Storage Optimization

Optimize SQLite for your use case.

```typescript
// In-memory database for testing
const memoryEngine = new Engine(':memory:', Sqlite);

// Temporary database
const tempEngine = new Engine('', Sqlite);

// Optimize for size
await engine.sql`PRAGMA auto_vacuum = INCREMENTAL`;
await engine.sql`PRAGMA page_size = 4096`;

// Optimize for speed
await engine.sql`PRAGMA cache_size = 10000`;
await engine.sql`PRAGMA temp_store = MEMORY`;
```

#### Bulk Operations

Optimize bulk operations for better performance.

```typescript
// Use prepared statements for bulk inserts
const stmt = await engine.sql`
  INSERT INTO users (name, email) VALUES (?, ?)
`;

// Batch insert with transaction
const transaction = await engine.transaction();
try {
  for (const user of users) {
    await transaction.query(stmt.query, [user.name, user.email]);
  }
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}

// Bulk update with CASE statements
await engine.sql`
  UPDATE users 
  SET status = CASE 
    WHEN id IN (${activeIds.join(',')}) THEN 'active'
    WHEN id IN (${inactiveIds.join(',')}) THEN 'inactive'
    ELSE status
  END
  WHERE id IN (${[...activeIds, ...inactiveIds].join(',')})
`;
```

The SQLite dialect provides comprehensive support for SQLite-specific features while working within SQLite's limitations, ensuring optimal performance and proper SQL generation for SQLite databases.

## Connection Classes

Connection classes provide database-specific implementations for interacting with different SQL engines. Each connection class implements the `Connection` interface from the Inquire library, ensuring a consistent API across all supported databases.

### Overview

Inquire supports multiple database engines through dedicated connection packages:

- **Mysql2Connection** - MySQL via `@stackpress/inquire-mysql2`
- **PGConnection** - PostgreSQL via `@stackpress/inquire-pg`
- **PGLiteConnection** - PGLite via `@stackpress/inquire-pglite`
- **BetterSqlite3Connection** - SQLite via `@stackpress/inquire-sqlite3`

### Mysql2Connection

The `Mysql2Connection` class provides a connection interface for interacting with MySQL databases using the mysql2 library.

```typescript
import mysql from 'mysql2/promise';
import connect from '@stackpress/inquire-mysql2';

const resource = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'inquire',
});

const engine = connect(resource);
```

#### Properties

The following properties are available when using Mysql2Connection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Mysql) |
| `lastId` | `number\|string\|undefined` | The last inserted ID from the database |

#### Methods

##### Formatting Queries

The following example shows how the connection formats queries and values for MySQL.

```typescript
const formatted = connection.format({
  query: 'INSERT INTO users (name, created_at) VALUES (?, ?)',
  values: ['John Doe', new Date()]
});
// Dates are converted to ISO strings
// Objects and arrays are JSON stringified
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `request` | `QueryObject` | The query object containing query string and values |

**Returns**

A formatted `QueryObject` with values converted for MySQL compatibility.

##### Executing Queries

The following example shows how to execute queries and get results.

```typescript
const users = await connection.query<User>({
  query: 'SELECT * FROM users WHERE age > ?',
  values: [18]
});
// Returns User[] with last inserted ID tracked
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `request` | `QueryObject` | The query object to execute |

**Returns**

A promise that resolves to an array of results typed as `R[]`.

##### Managing Transactions

The following example shows how to execute transactions with MySQL.

```typescript
const result = await connection.transaction(async (trx) => {
  await trx.query({ query: 'INSERT INTO users (name) VALUES (?)', values: ['Alice'] });
  await trx.query({ query: 'INSERT INTO posts (title) VALUES (?)', values: ['Hello'] });
  return 'success';
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `callback` | `Transaction<R>` | Callback function that receives the transaction connection |

**Returns**

A promise that resolves to the return value of the callback function.

### PGConnection

The `PGConnection` class provides a connection interface for interacting with PostgreSQL databases.

```typescript
import { Client } from 'pg';
import connect from '@stackpress/inquire-pg';

const client = new Client({
  database: 'inquire',
  user: 'postgres'
});
await client.connect();

const engine = connect(client);
```

#### Properties

The following properties are available when using PGConnection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Pgsql) |

#### Methods

##### Formatting Queries

The following example shows how the connection formats queries for PostgreSQL.

```typescript
const formatted = connection.format({
  query: 'SELECT * FROM users WHERE id = ? AND name = ?',
  values: [1, 'John']
});
// Query becomes: 'SELECT * FROM users WHERE id = $1 AND name = $2'
// Values are converted for PostgreSQL compatibility
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `request` | `QueryObject` | The query object containing query string and values |

**Returns**

A formatted `QueryObject` with PostgreSQL-style parameter placeholders ($1, $2, etc.).

##### Executing Queries

The following example shows how to execute queries and get results.

```typescript
const users = await connection.query<User>({
  query: 'SELECT * FROM users WHERE age > $1',
  values: [18]
});
// Returns User[] from the rows property
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `request` | `QueryObject` | The query object to execute |

**Returns**

A promise that resolves to an array of results typed as `R[]`.

##### Managing Transactions

The following example shows how to execute transactions with PostgreSQL.

```typescript
const result = await connection.transaction(async (trx) => {
  await trx.query({ query: 'INSERT INTO users (name) VALUES ($1)', values: ['Alice'] });
  await trx.query({ query: 'INSERT INTO posts (title) VALUES ($1)', values: ['Hello'] });
  return 'success';
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `callback` | `Transaction<R>` | Callback function that receives the transaction connection |

**Returns**

A promise that resolves to the return value of the callback function.

### PGLiteConnection

The `PGLiteConnection` class provides a connection interface for interacting with PGLite databases.

```typescript
import { PGlite } from '@electric-sql/pglite';
import connect from '@stackpress/inquire-pglite';

const db = new PGlite();
const engine = connect(db);
```

#### Properties

The following properties are available when using PGLiteConnection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Pgsql) |

#### Methods

##### Formatting Queries

The following example shows how the connection formats queries for PGLite.

```typescript
const formatted = connection.format({
  query: 'SELECT * FROM users WHERE id = ? AND name = ?',
  values: [1, 'John']
});
// Query becomes: 'SELECT * FROM users WHERE id = $1 AND name = $2'
// Values are converted for PGLite compatibility
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `request` | `QueryObject` | The query object containing query string and values |

**Returns**

A formatted `QueryObject` with PostgreSQL-style parameter placeholders.

##### Executing Queries

The following example shows how to execute queries with PGLite.

```typescript
const users = await connection.query<User>({
  query: 'SELECT * FROM users WHERE age > $1',
  values: [18]
});
// Returns User[] from the rows property
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `request` | `QueryObject` | The query object to execute |

**Returns**

A promise that resolves to an array of results typed as `R[]`.

##### Managing Transactions

The following example shows how to execute transactions with PGLite.

```typescript
const result = await connection.transaction(async (trx) => {
  await trx.query({ query: 'INSERT INTO users (name) VALUES ($1)', values: ['Alice'] });
  await trx.query({ query: 'INSERT INTO posts (title) VALUES ($1)', values: ['Hello'] });
  return 'success';
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `callback` | `Transaction<R>` | Callback function that receives the transaction connection |

**Returns**

A promise that resolves to the return value of the callback function.

### BetterSqlite3Connection

The `BetterSqlite3Connection` class provides a connection interface for interacting with SQLite databases using the better-sqlite3 library.

```typescript
import sqlite from 'better-sqlite3';
import connect from '@stackpress/inquire-sqlite3';

const db = sqlite(':memory:');
const engine = connect(db);
```

#### Properties

The following properties are available when using BetterSqlite3Connection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Sqlite) |
| `lastId` | `number\|string\|undefined` | The last inserted row ID from the database |

#### Methods

##### Formatting Queries

The following example shows how the connection formats queries for SQLite.

```typescript
const formatted = connection.format({
  query: 'INSERT INTO users (name, active, data) VALUES (?, ?, ?)',
  values: ['John', true, { profile: 'data' }]
});
// Booleans are converted to numbers (0/1)
// Objects and arrays are JSON stringified
// Dates are converted to ISO strings
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `request` | `QueryObject` | The query object containing query string and values |

**Returns**

A formatted `QueryObject` with values converted for SQLite compatibility.

##### Executing Queries

The following example shows how to execute queries with SQLite.

```typescript
const users = await connection.query<User>({
  query: 'SELECT * FROM users WHERE age > ?',
  values: [18]
});
// Returns User[] with last inserted row ID tracked
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `request` | `QueryObject` | The query object to execute |

**Returns**

A promise that resolves to an array of results typed as `R[]`.

##### Managing Transactions

The following example shows how to execute transactions with SQLite.

```typescript
const result = await connection.transaction(async (trx) => {
  await trx.query({ query: 'INSERT INTO users (name) VALUES (?)', values: ['Alice'] });
  await trx.query({ query: 'INSERT INTO posts (title) VALUES (?)', values: ['Hello'] });
  return 'success';
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `callback` | `Transaction<R>` | Callback function that receives the transaction connection |

**Returns**

A promise that resolves to the return value of the callback function.

### Common Interface

All connection classes implement the same `Connection<R>` interface, providing:

#### Core Methods

- **`format(request: QueryObject)`** - Formats queries and values for the specific database
- **`query<R>(request: QueryObject)`** - Executes queries and returns typed results
- **`raw<R>(request: QueryObject)`** - Executes queries and returns raw database results
- **`resource()`** - Returns the underlying database connection resource
- **`transaction<R>(callback: Transaction<R>)`** - Manages database transactions

#### Type Safety

All connection classes support TypeScript generics for type-safe operations:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
};

// Type-safe query execution
const users = await connection.query<User>({
  query: 'SELECT * FROM users',
  values: []
});
// users is typed as User[]
```

#### Error Handling

All connections use consistent error handling through the `InquireException`:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await connection.query({ query: 'INVALID SQL', values: [] });
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Database error:', error.message);
  }
}
```

### Database-Specific Features

#### MySQL Features

- **Auto-increment tracking**: Automatically tracks `lastId` for inserted records
- **Date handling**: Converts JavaScript Date objects to ISO strings
- **Transaction support**: Uses `BEGIN`, `COMMIT`, and `ROLLBACK`

#### PostgreSQL Features

- **Parameter placeholders**: Converts `?` placeholders to `$1`, `$2`, etc.
- **Strict parameter matching**: Validates that query placeholders match provided values
- **Transaction support**: Uses `BEGIN`, `COMMIT`, and `ROLLBACK`

#### SQLite Features

- **Boolean conversion**: Converts boolean values to numbers (0/1)
- **Row ID tracking**: Automatically tracks `lastInsertRowid`
- **Query optimization**: Uses `stmt.all()` for SELECT queries and `stmt.run()` for others
- **Transaction support**: Uses `BEGIN TRANSACTION`, `COMMIT`, and `ROLLBACK`

#### PGLite Features

- **PostgreSQL compatibility**: Uses PostgreSQL syntax and parameter placeholders
- **Lightweight**: Optimized for client-side and edge environments
- **Exec optimization**: Uses `exec()` for queries without parameters
