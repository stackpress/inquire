# PostgreSQL Dialect

PostgreSQL-specific SQL dialect implementation for converting query builders to PostgreSQL-compatible SQL statements with proper syntax, data types, and advanced features.

```typescript
import { Pgsql } from '@stackpress/inquire';
import Engine from '@stackpress/inquire';

// Using PostgreSQL dialect directly
const engine = new Engine(connection, Pgsql);

// Or access through engine
const { query, values } = engine.select().from('users').query(Pgsql);
```

 1. [Properties](#1-properties)
 2. [Static Properties](#2-static-properties)
 3. [Methods](#3-methods)
 4. [PostgreSQL-Specific Features](#4-postgresql-specific-features)
 5. [Advanced PostgreSQL Features](#5-advanced-postgresql-features)
 6. [Error Handling](#6-error-handling)
 7. [Performance Considerations](#7-performance-considerations)

## 1. Properties

The following properties are available in the PostgreSQL dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for identifiers (double quote: ") |

## 2. Static Properties

The following properties can be accessed directly from the PostgreSQL dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for PostgreSQL identifiers (") |
| `typemap` | `Record<string, string>` | Mapping of generic types to PostgreSQL-specific types |

## 3. Methods

The following methods are available in the PostgreSQL dialect for converting query builders to SQL.

### 3.1. Converting ALTER Queries

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

### 3.2. Converting CREATE Queries

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

### 3.3. Converting DELETE Queries

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

### 3.4. Converting INSERT Queries

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

### 3.5. Converting SELECT Queries

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

### 3.6. Converting UPDATE Queries

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

### 3.7. Dropping Tables

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

### 3.8. Renaming Tables

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

### 3.9. Truncating Tables

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

## 4. PostgreSQL-Specific Features

PostgreSQL-specific features and optimizations for enhanced database operations.

### 4.1. Data Type Mapping

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

### 4.2. Serial Types and Auto-Increment

PostgreSQL dialect automatically converts auto-increment fields to SERIAL types.

```typescript
 // Automatic SERIAL type selection
 engine.create('users')
   .field('id', { type: 'int', autoIncrement: true })     // Becomes SERIAL
   .field('big_id', { type: 'int', length: 20, autoIncrement: true }) // Becomes BIGSERIAL
   .field('small_id', { type: 'int', length: 1, autoIncrement: true }); // Becomes SMALLSERIAL
```

### 4.3. Default Value Handling

PostgreSQL dialect provides intelligent default value conversion.

```typescript
 engine.create('users')
   .field('id', { type: 'int', autoIncrement: true })
   .field('active', { type: 'boolean', default: true })        // DEFAULT TRUE
   .field('score', { type: 'int', default: 0 })                // DEFAULT 0
   .field('created_at', { type: 'datetime', default: 'now()' }) // DEFAULT CURRENT_TIMESTAMP
   .field('data', { type: 'json', default: {} });              // DEFAULT '{}'
```

### 4.4. RETURNING Clause Support

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

### 4.5. Index Creation

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

### 4.6. Advanced Constraint Support

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

### 4.7. Identifier Quoting

PostgreSQL dialect uses double quotes for identifier quoting to handle reserved words and case sensitivity.

```typescript
 // All identifiers are properly quoted
 const { query } = engine.select('order', 'group', 'select')
   .from('user_table')
   .where('"order" = ?', [1])
   .query(Pgsql);

 // Generates: SELECT "order", "group", "select" FROM "user_table" WHERE "order" = ?
```

## 5. Advanced PostgreSQL Features

Advanced PostgreSQL features and capabilities for complex database operations.

### 5.1. JSONB Operations

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

### 5.2. Array Operations

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

### 5.3. Common Table Expressions (CTEs)

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

### 5.4. Window Functions

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

### 5.5. Full-Text Search

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

### 5.6. Partitioning

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

## 6. Error Handling

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

## 7. Performance Considerations

Performance optimization techniques for PostgreSQL operations.

### 7.1. Query Optimization

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

### 7.2. Bulk Operations

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

### 7.3. Connection Pooling

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
