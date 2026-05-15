# SQLite Dialect

SQLite-specific SQL dialect implementation for converting query builders to SQLite-compatible SQL statements with proper syntax, data types, and SQLite-specific features.

```typescript
import { Sqlite } from '@stackpress/inquire';
import Engine from '@stackpress/inquire';

// Using SQLite dialect directly
const engine = new Engine(connection, Sqlite);

// Or access through engine
const { query, values } = engine.select().from('users').query(Sqlite);
```

 1. [Properties](#1-properties)
 2. [Static Properties](#2-static-properties)
 3. [Methods](#3-methods)
 4. [SQLite-Specific Features](#4-sqlite-specific-features)
 5. [SQLite Limitations and Workarounds](#5-sqlite-limitations-and-workarounds)
 6. [Advanced SQLite Features](#6-advanced-sqlite-features)
 7. [Error Handling](#7-error-handling)
 8. [Performance Considerations](#8-performance-considerations)

## 1. Properties

The following properties are available in the SQLite dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for identifiers (backtick: `) |

## 2. Static Properties

The following properties can be accessed directly from the SQLite dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for SQLite identifiers (`) |
| `typemap` | `Record<string, string>` | Mapping of generic types to SQLite-specific types |

## 3. Methods

The following methods are available in the SQLite dialect for converting query builders to SQL.

### 3.1. Converting ALTER Queries

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

### 3.2. Converting CREATE Queries

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

### 3.3. Converting DELETE Queries

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

### 3.4. Converting INSERT Queries

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

### 3.5. Converting SELECT Queries

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

### 3.6. Converting UPDATE Queries

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

### 3.7. Dropping Tables

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

### 3.8. Renaming Tables

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

### 3.9. Truncating Tables

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

## 4. SQLite-Specific Features

SQLite-specific features and optimizations for enhanced database operations.

### 4.1. Data Type Mapping

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

### 4.2. Boolean Handling

SQLite dialect converts boolean values to integers (0/1) for storage.

```typescript
 engine.create('users')
   .field('active', { type: 'boolean', default: true })   // DEFAULT 1
   .field('verified', { type: 'boolean', default: false }) // DEFAULT 0
   .field('premium', { type: 'boolean' });                 // INTEGER type
```

### 4.3. Auto-Increment Support

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

### 4.4. Default Value Handling

SQLite dialect provides intelligent default value conversion.

```typescript
 engine.create('users')
   .field('id', { type: 'int', autoIncrement: true })
   .field('active', { type: 'boolean', default: true })        // DEFAULT 1
   .field('score', { type: 'int', default: 0 })                // DEFAULT 0
   .field('created_at', { type: 'datetime', default: 'now()' }) // DEFAULT CURRENT_TIMESTAMP
   .field('data', { type: 'text', default: '{}' });            // DEFAULT '{}'
```

### 4.5. Index Creation

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

### 4.6. Foreign Key Support

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

### 4.7. Identifier Quoting

SQLite dialect uses backticks for identifier quoting to handle reserved words and special characters.

```typescript
 // All identifiers are properly quoted
 const { query } = engine.select('order', 'group', 'select')
   .from('user-table')
   .where('`order` = ?', [1])
   .query(Sqlite);

 // Generates: SELECT `order`, `group`, `select` FROM `user-table` WHERE `order` = ?
```

## 5. SQLite Limitations and Workarounds

SQLite limitations and recommended workarounds for complex operations.

### 5.1. ALTER TABLE Limitations

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

### 5.2. Data Type Flexibility

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

## 6. Advanced SQLite Features

Advanced SQLite features and capabilities for complex database operations.

### 6.1. JSON Operations

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

### 6.2. Full-Text Search

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

### 6.3. Common Table Expressions (CTEs)

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

### 6.4. Window Functions

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

### 6.5. PRAGMA Statements

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

## 7. Error Handling

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

## 8. Performance Considerations

Performance optimization techniques for SQLite operations.

### 8.1. Indexing Strategy

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

### 8.2. Transaction Usage

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

### 8.3. Memory and Storage Optimization

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

### 8.4. Bulk Operations

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
