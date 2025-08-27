# Examples

This document provides comprehensive examples of using the Inquire SQL library across different scenarios and database engines.

## Table of Contents

- [Basic CRUD Operations](#basic-crud-operations)
- [Advanced Query Building](#advanced-query-building)
- [Schema Management](#schema-management)
- [Transactions](#transactions)
- [Type Safety Examples](#type-safety-examples)
- [Database-Specific Examples](#database-specific-examples)

## Basic CRUD Operations

### Creating Tables

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

### Inserting Data

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

### Selecting Data

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

### Updating Data

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

### Deleting Data

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

## Advanced Query Building

### Complex Joins

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

### Subqueries

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

### Aggregations

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

### Window Functions (PostgreSQL)

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

## Schema Management

### Table Alterations

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

### Schema Comparison and Migration

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

### Table Management

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

## Transactions

### Basic Transactions

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

### Error Handling in Transactions

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

## Type Safety Examples

### Defining Types

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

### Type-Safe Queries

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

## Database-Specific Examples

### MySQL Examples

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

### PostgreSQL Examples

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

### SQLite Examples

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

### PGLite Examples

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

## Real-World Use Cases

### Blog Application

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

### E-commerce Product Catalog

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

This comprehensive examples documentation covers the most common use cases and patterns for using the Inquire library across different scenarios and database engines.
