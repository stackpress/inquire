# SQL Dialects

This directory contains comprehensive API documentation for Inquire's SQL dialect implementations. Each dialect converts query builders to database-specific SQL statements with proper syntax, data types, and optimizations.

## Overview

SQL dialects are the translation layer between Inquire's universal query builders and database-specific SQL syntax. They handle the nuances of different database engines, ensuring optimal SQL generation while maintaining a consistent API across all supported databases.

```typescript
import { Engine, Mysql, Pgsql, Sqlite } from '@stackpress/inquire';

// Use specific dialect
const mysqlEngine = new Engine(connection, Mysql);
const pgEngine = new Engine(connection, Pgsql);
const sqliteEngine = new Engine(connection, Sqlite);

// Or get dialect-specific SQL
const { query, values } = engine.select().from('users').query(Mysql);
```

## Available Dialects

### [MySQL](./MySQL.md)
MySQL-specific SQL dialect implementation with comprehensive support for MySQL features and optimizations.

**Key Features:**
- Backtick identifier quoting (`)
- MySQL-specific data type mapping (JSON, SET, ENUM)
- Integer type optimization (TINYINT, INT, BIGINT)
- Storage engine support (InnoDB, MyISAM)
- Character set and collation handling
- Full-text search with MATCH/AGAINST
- JSON functions and operations
- Multi-table operations

**Supported MySQL Versions:**
- MySQL 5.7+
- MySQL 8.0+ (with advanced features)
- MariaDB 10.2+

**Common Use Cases:**
- Web applications requiring high performance
- Applications with complex JSON data
- Systems requiring full-text search
- Multi-user applications with high concurrency

### [PostgreSQL](./PostgreSQL.md)
PostgreSQL-specific SQL dialect implementation with support for advanced PostgreSQL features.

**Key Features:**
- Double quote identifier quoting (")
- Advanced data type support (JSONB, arrays, custom types)
- SERIAL and auto-increment handling
- RETURNING clause support for all operations
- Common Table Expressions (CTEs)
- Window functions
- Array operations and aggregations
- Full-text search with tsvector
- Partitioning support
- Advanced constraint handling

**Supported PostgreSQL Versions:**
- PostgreSQL 12+
- PostgreSQL 13+ (with enhanced features)
- PostgreSQL 14+ (with latest optimizations)

**Common Use Cases:**
- Complex analytical applications
- Applications requiring advanced data types
- Systems with complex relationships
- Data warehousing and reporting

### [SQLite](./SQLite.md)
SQLite-specific SQL dialect implementation optimized for SQLite's unique characteristics and limitations.

**Key Features:**
- Backtick identifier quoting (`)
- Dynamic typing with intelligent type mapping
- Boolean handling as INTEGER (0/1)
- AUTOINCREMENT support
- Limited ALTER TABLE workarounds
- JSON functions (SQLite 3.38+)
- Full-text search with FTS5
- PRAGMA statement support
- Common Table Expressions
- Window functions (SQLite 3.25+)

**Supported SQLite Versions:**
- SQLite 3.25+ (for window functions)
- SQLite 3.35+ (for enhanced ALTER TABLE)
- SQLite 3.38+ (for JSON functions)

**Common Use Cases:**
- Mobile applications
- Desktop applications
- Embedded systems
- Development and testing
- Small to medium-sized applications

## Dialect Comparison

| Feature | MySQL | PostgreSQL | SQLite |
|---------|-------|------------|--------|
| **Identifier Quoting** | Backticks (`) | Double quotes (") | Backticks (`) |
| **JSON Support** | JSON type | JSONB type | TEXT (JSON functions) |
| **Arrays** | Limited | Native support | Limited |
| **Boolean Type** | BOOLEAN/TINYINT | BOOLEAN | INTEGER (0/1) |
| **Auto Increment** | AUTO_INCREMENT | SERIAL/IDENTITY | AUTOINCREMENT |
| **RETURNING Clause** | No | Yes | Yes (3.35+) |
| **Window Functions** | Yes (8.0+) | Yes | Yes (3.25+) |
| **Full-Text Search** | FULLTEXT indexes | tsvector/tsquery | FTS5 virtual tables |
| **CTEs** | Yes (8.0+) | Yes | Yes |
| **Partitioning** | Yes | Yes | No |

## Data Type Mapping

Each dialect provides intelligent data type mapping from generic types to database-specific types:

### Generic to Database-Specific Types

| Generic Type | MySQL | PostgreSQL | SQLite |
|--------------|-------|------------|--------|
| `object` | JSON | JSONB | TEXT |
| `json` | JSON | JSONB | TEXT |
| `string` | VARCHAR | VARCHAR | VARCHAR |
| `text` | TEXT | TEXT | TEXT |
| `boolean` | BOOLEAN | BOOLEAN | INTEGER |
| `int` | INT | INTEGER | INTEGER |
| `float` | FLOAT | DECIMAL | REAL |
| `date` | DATE | DATE | INTEGER |
| `datetime` | DATETIME | TIMESTAMP | INTEGER |

### Type-Specific Optimizations

```typescript
// MySQL: Automatic integer type selection
engine.create('users')
  .field('flag', { type: 'int', length: 1 })    // TINYINT
  .field('id', { type: 'int', length: 11 })     // INT
  .field('big_id', { type: 'int', length: 20 }) // BIGINT

// PostgreSQL: SERIAL types for auto-increment
engine.create('users')
  .field('id', { type: 'int', autoIncrement: true })     // SERIAL
  .field('big_id', { type: 'int', length: 20, autoIncrement: true }) // BIGSERIAL

// SQLite: Boolean as INTEGER
engine.create('users')
  .field('active', { type: 'boolean', default: true })   // INTEGER DEFAULT 1
```

## Advanced Features by Dialect

### MySQL Advanced Features

```typescript
// JSON operations
await engine.sql`
  SELECT JSON_EXTRACT(data, '$.name') as name
  FROM users 
  WHERE JSON_CONTAINS(data, ${'{"active": true}'})
`;

// Full-text search
await engine.sql`
  SELECT *, MATCH(title, content) AGAINST(${['search term']} IN BOOLEAN MODE) as relevance
  FROM posts 
  WHERE MATCH(title, content) AGAINST(${['search term']} IN BOOLEAN MODE)
`;

// Multi-table operations
await engine.sql`
  DELETE u, p 
  FROM users u 
  LEFT JOIN posts p ON u.id = p.user_id 
  WHERE u.active = ${[false]}
`;
```

### PostgreSQL Advanced Features

```typescript
// JSONB operations
await engine.sql`
  SELECT * FROM users 
  WHERE data @> ${'{"active": true}'}
`;

// Array operations
await engine.sql`
  SELECT * FROM posts 
  WHERE ${['tag1', 'tag2']} && tags
`;

// CTEs with RETURNING
await engine.sql`
  WITH moved_posts AS (
    UPDATE posts 
    SET category_id = ${[2]}
    WHERE category_id = ${[1]}
    RETURNING *
  )
  SELECT count(*) as moved_count FROM moved_posts
`;

// Window functions
await engine.sql`
  SELECT 
    name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) as rank
  FROM employees
`;
```

### SQLite Advanced Features

```typescript
// JSON functions (SQLite 3.38+)
await engine.sql`
  SELECT json_extract(data, '$.name') as name
  FROM users 
  WHERE json_valid(data) = 1
`;

// Full-text search with FTS5
await engine.sql`
  CREATE VIRTUAL TABLE posts_fts USING fts5(title, content)
`;

// PRAGMA configuration
await engine.sql`PRAGMA foreign_keys = ON`;
await engine.sql`PRAGMA journal_mode = WAL`;
```

## Performance Optimizations

### MySQL Optimizations

- Automatic integer type selection based on length
- InnoDB engine optimization for transactions
- Query cache utilization
- Index hint support through raw SQL

### PostgreSQL Optimizations

- JSONB binary format for faster JSON operations
- Efficient array operations
- Advanced indexing strategies (GIN, GiST)
- Connection pooling optimization

### SQLite Optimizations

- WAL mode for better concurrency
- Pragma optimizations for specific use cases
- Efficient bulk operations with transactions
- Memory-mapped I/O for large databases

## Error Handling

Each dialect provides specific error handling for database-specific error codes:

### MySQL Error Codes
```typescript
try {
  await engine.insert('users').values({ email: 'duplicate@example.com' });
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    console.error('Duplicate entry for unique constraint');
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    console.error('Foreign key constraint violation');
  }
}
```

### PostgreSQL Error Codes
```typescript
try {
  await engine.insert('users').values({ email: 'duplicate@example.com' });
} catch (error) {
  if (error.code === '23505') {
    console.error('Unique constraint violation');
  } else if (error.code === '23503') {
    console.error('Foreign key constraint violation');
  }
}
```

### SQLite Error Codes
```typescript
try {
  await engine.insert('users').values({ email: 'duplicate@example.com' });
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    console.error('Unique constraint violation');
  } else if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    console.error('Foreign key constraint violation');
  }
}
```

## Migration Considerations

### Cross-Database Migrations

When migrating between databases, consider dialect-specific differences:

```typescript
// Generic migration that works across dialects
await engine.create('users')
  .field('id', { type: 'int', autoIncrement: true })
  .field('name', { type: 'varchar', length: 255 })
  .field('active', { type: 'boolean', default: true })
  .field('data', { type: 'json' })
  .primary('id');

// Database-specific optimizations
if (engine.dialect === Mysql) {
  await engine.sql`ALTER TABLE users ENGINE=InnoDB`;
} else if (engine.dialect === Pgsql) {
  await engine.sql`CREATE INDEX CONCURRENTLY idx_users_data ON users USING GIN (data)`;
} else if (engine.dialect === Sqlite) {
  await engine.sql`PRAGMA foreign_keys = ON`;
}
```

## Best Practices

### Dialect Selection
1. **MySQL**: Choose for web applications requiring high performance and concurrent access
2. **PostgreSQL**: Choose for complex applications requiring advanced data types and analytics
3. **SQLite**: Choose for embedded applications, mobile apps, or development/testing

### Cross-Dialect Compatibility
1. Use generic data types when possible
2. Avoid dialect-specific features in shared code
3. Use raw SQL for database-specific optimizations
4. Test migrations across all target databases

### Performance Optimization
1. Leverage dialect-specific indexing strategies
2. Use appropriate data types for each database
3. Optimize queries based on database capabilities
4. Monitor and tune database-specific settings

## Testing Across Dialects

```typescript
// Test suite that runs across all dialects
const dialects = [Mysql, Pgsql, Sqlite];

dialects.forEach(dialect => {
  describe(`${dialect.name} dialect`, () => {
    let engine;
    
    beforeEach(() => {
      engine = new Engine(getConnection(dialect), dialect);
    });
    
    it('should create and query users', async () => {
      await engine.create('users')
        .field('id', { type: 'int', autoIncrement: true })
        .field('name', { type: 'varchar', length: 255 })
        .primary('id');
      
      await engine.insert('users').values({ name: 'John' });
      const users = await engine.select().from('users');
      
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('John');
    });
  });
});
```

Each dialect documentation provides detailed information about database-specific features, optimizations, and best practices to help you make the most of your chosen database system while maintaining the flexibility to switch between databases when needed.
