# Query Builders

This directory contains comprehensive API documentation for Inquire's SQL query builders. Each builder provides a fluent, type-safe interface for constructing SQL queries that work across different database engines.

 1. [Overview](#1-overview)
 2. [Available Builders](#2-available-builders)
 3. [Common Patterns](#3-common-patterns)
 4. [Database Compatibility](#4-database-compatibility)
 5. [Performance Considerations](#5-performance-considerations)
 6. [Best Practices](#6-best-practices)
 7. [Schema Migrations](#7-schema-migrations)

## 1. Overview

This section provides an introduction to Inquire's query builder system and demonstrates the fundamental concepts behind the fluent API design.

Query builders are the core components of Inquire that allow you to construct SQL queries using a chainable, expressive API. They automatically handle SQL generation, parameter binding, and dialect-specific optimizations.

```typescript
import { engine } from '@stackpress/inquire';

// Example: Fluent query building
const users = await engine.select(['id', 'name', 'email'])
  .from('users')
  .where('active = ?', [true])
  .orderBy('created_at', 'DESC')
  .limit(10);
```

## 2. Available Builders

This section provides detailed information about each query builder available in Inquire, including their key features and common use cases.

### 2.1. [Alter](./Alter.md)

Modifies existing table structures by adding, removing, or changing fields and constraints.

**Key Features:**

- Add/remove/modify table fields
- Manage indexes and constraints
- Add/remove primary keys, unique keys, and foreign keys
- Database-specific optimizations
- Type-safe operations

**Common Use Cases:**

- Schema migrations
- Adding new features to existing tables
- Performance optimizations through indexing
- Data type upgrades

### 2.2. [Create](./Create.md)

Defines and creates new database tables with fields, indexes, and constraints.

**Key Features:**

- Define table fields with various data types
- Set primary keys, unique constraints, and indexes
- Configure foreign key relationships
- Database-specific table options (engine, charset, collation)
- Comprehensive field attribute support

**Common Use Cases:**

- Initial database schema creation
- Creating new tables for features
- Setting up relational database structures
- Defining constraints and relationships

### 2.3. [Delete](./Delete.md)

Removes records from database tables with type-safe operations and flexible filtering.

**Key Features:**

- Flexible WHERE condition support
- Complex filtering with subqueries
- Batch deletion capabilities
- Safe deletion patterns with validation
- Performance-optimized operations

**Common Use Cases:**

- Data cleanup and maintenance
- User-initiated record deletion
- Bulk data removal
- Conditional data purging

### 2.4. [Insert](./Insert.md)

Handles insertion of single or multiple records into tables with advanced conflict resolution.

**Key Features:**

- Single and bulk record insertion
- Conflict resolution (ON CONFLICT, ON DUPLICATE KEY UPDATE)
- RETURNING clause support (PostgreSQL/SQLite)
- Type-safe value insertion
- Batch processing capabilities

**Common Use Cases:**

- Creating new records
- Bulk data imports
- Upsert operations
- Data synchronization

### 2.5. [Select](./Select.md)

Provides comprehensive querying capabilities with support for joins, conditions, grouping, and ordering.

**Key Features:**

- Complex JOIN operations (INNER, LEFT, RIGHT)
- Advanced filtering with WHERE and HAVING clauses
- Grouping and aggregation functions
- Ordering and pagination
- Subquery support
- Window functions (database-specific)

**Common Use Cases:**

- Data retrieval and reporting
- Complex analytical queries
- Relational data fetching
- Paginated result sets

### 2.6. [Update](./Update.md)

Modifies existing records in tables with support for conditions and joins.

**Key Features:**

- Flexible value setting with expressions
- Complex WHERE conditions
- JOIN-based updates (MySQL/PostgreSQL)
- RETURNING clause support (PostgreSQL)
- Batch update operations
- Conditional updates

**Common Use Cases:**

- Record modifications
- Status transitions
- Bulk data updates
- Calculated field updates

## 3. Common Patterns

This section covers common usage patterns and techniques that apply across all query builders, including type safety, error handling, and query inspection.

### 3.1. Type Safety

The following examples demonstrate how to use TypeScript generics with query builders for compile-time type checking.

**Type-Safe Operations**

All builders support TypeScript generics for compile-time type checking:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};

// Type-safe operations
const users: User[] = await engine.select<User>('*').from('users');
const newUser: User[] = await engine.insert<User>('users')
  .values({ name: 'John', email: 'john@example.com', active: true })
  .returning('*');
```

### 3.2. Error Handling

The following examples show how to implement consistent error handling across all query builders.

**Exception Handling**

Consistent error handling across all builders:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await engine.insert('users').values({ email: 'invalid-email' });
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Database error:', error.message);
  }
}
```

### 3.3. Query Inspection

The following examples demonstrate how to inspect generated SQL queries before execution for debugging and optimization.

**SQL Query Inspection**

All builders allow query inspection before execution:

```typescript
const builder = engine.select('*').from('users').where('active = ?', [true]);
const { query, values } = builder.query();

console.log('SQL:', query);
console.log('Parameters:', values);

// Then execute
const results = await builder;
```

### 3.4. Transaction Support

The following examples show how all query builders work seamlessly within database transactions.

**Transactional Operations**

All builders work seamlessly with transactions:

```typescript
await engine.transaction(async (trx) => {
  const user = await trx.insert('users')
    .values({ name: 'John', email: 'john@example.com' })
    .returning('id');
  
  await trx.insert('profiles')
    .values({ user_id: user[0].id, bio: 'User profile' });
});
```

## 4. Database Compatibility

This section outlines the database systems supported by Inquire's query builders and their compatibility features.

All query builders are designed to work across different SQL databases:

 - **MySQL** - Full support with MySQL-specific optimizations
 - **PostgreSQL** - Full support with advanced PostgreSQL features
 - **SQLite** - Full support with SQLite-specific considerations
 - **CockroachDB** - Compatible through PostgreSQL dialect
 - **NeonDB** - Compatible through PostgreSQL dialect

## 5. Performance Considerations

This section provides guidelines for optimizing query performance and leveraging database-specific features for better performance.

### 5.1. Indexing

The following guidelines help ensure optimal query performance through proper indexing strategies.

**Index Usage Guidelines**

Ensure proper indexing for WHERE clauses and JOIN conditions:

```typescript
// Use indexed columns in WHERE clauses
await engine.select().from('users').where('email = ?', [email]); // email should be indexed
```

### 5.2. Batch Operations

The following examples demonstrate how to use batch operations for improved performance with large datasets.

**Batch Processing Examples**

Use batch operations for better performance:

```typescript
// Batch insert instead of individual inserts
await engine.insert('users').values([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
  // ... more users
]);
```

### 5.3. Query Optimization

The following guidelines help optimize query performance across different database systems.

**Optimization Guidelines**

 - Specify only needed columns instead of using `SELECT *`
 - Use appropriate LIMIT clauses for pagination
 - Leverage database-specific features through raw SQL when needed

## 6. Best Practices

This section outlines recommended practices for using query builders effectively and maintaining high-quality database code.

 1. **Use Type Safety**: Always define TypeScript types for your data structures
 2. **Handle Errors**: Implement proper error handling for database operations
 3. **Use Transactions**: Group related operations in transactions for data consistency
 4. **Optimize Queries**: Use indexes and avoid N+1 query problems
 5. **Validate Input**: Always validate user input before database operations
 6. **Use Prepared Statements**: Builders automatically use parameterized queries for security

## 7. Schema Migrations

The following examples show how query builders facilitate database migrations and schema changes.

**Migration Examples**


```typescript
// Migration: Add new field and index
await engine.alter('users')
  .addField('phone', { type: 'VARCHAR', length: 20, nullable: true })
  .addIndex('idx_phone', ['phone']);

// Migration: Create new table with relationships
await engine.create('user_profiles')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('user_id', { type: 'INTEGER', nullable: false })
  .addField('bio', { type: 'TEXT', nullable: true })
  .addPrimaryKey('id')
  .addForeignKey('fk_user', {
    local: ['user_id'],
    foreign: { table: 'users', columns: ['id'] },
    onDelete: 'CASCADE'
  });
```

Each builder documentation provides detailed examples, parameters, and database-specific features to help you build efficient and maintainable database operations.
