# Delete

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

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Database-Specific Features](#3-database-specific-features)
 4. [Type Safety](#4-type-safety)
 5. [Advanced Patterns](#5-advanced-patterns)
 6. [Error Handling](#6-error-handling)
 7. [Performance Considerations](#7-performance-considerations)

## 1. Properties

The following properties are available when instantiating a Delete builder.

| Property | Type | Description |
|----------|------|-------------|
| `engine` | `Engine` | Database engine instance for query execution |

## 2. Methods

The following methods are available when instantiating a Delete builder.

### 2.1. Setting WHERE Conditions

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

### 2.2. Building Query Object

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

### 2.3. Getting Query String

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

### 2.4. Executing the Delete

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

## 3. Database-Specific Features

Database-specific features and optimizations for DELETE operations across different SQL dialects.

### 3.1. MySQL

MySQL DELETE operations support additional features and optimizations.

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

### 3.2. PostgreSQL

PostgreSQL DELETE operations with RETURNING clause and advanced features.

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

### 3.3. SQLite

SQLite DELETE operations with specific considerations.

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

## 4. Type Safety

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

## 5. Advanced Patterns

Advanced patterns and techniques for complex DELETE operations.

### 5.1. Conditional Deletion

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

### 5.2. Batch Deletion

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

### 5.3. Safe Deletion with Validation

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

## 6. Error Handling

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

## 7. Performance Considerations

Performance optimization techniques for DELETE operations.

### 7.1. Indexing for Deletions

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

### 7.2. Transaction Usage

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

### 7.3. Monitoring Delete Operations

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
