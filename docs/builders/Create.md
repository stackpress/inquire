# Create

The Create builder is used to define and create new database tables with fields, indexes, and constraints. It provides a fluent API for building table schemas that work across different SQL dialects.

```typescript
const create = engine.create('users')
  .addField('id', { type: 'INTEGER', autoIncrement: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('email', { type: 'VARCHAR', length: 255 })
  .addPrimaryKey('id');

await create;
```

 1. [Overview](#1-overview)
 2. [Properties](#2-properties)
 3. [Field Management](#3-field-management)
 4. [Key Operations](#4-key-operations)
 5. [Index Management](#5-index-management)
 6. [Table Configuration](#6-table-configuration)
 7. [Getting Query Information](#7-getting-query-information)
 8. [Common Data Types](#8-common-data-types)
 9. [Database-Specific Features](#9-database-specific-features)
 10. [Type Safety](#10-type-safety)
 11. [Error Handling](#11-error-handling)

## 1. Overview

The Create builder provides comprehensive functionality for defining new database table structures. It supports various data types, constraints, indexes, and relationships while maintaining compatibility across different database engines.

Key capabilities include:

 - Defining table fields with various data types and constraints
 - Setting up primary keys, unique keys, and foreign key relationships
 - Creating indexes for improved query performance
 - Database-specific optimizations and features
 - Type-safe table schema definitions

## 2. Properties

The following properties are available when instantiating a Create builder.

| Property | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table being created |
| `engine` | `Engine` | The database engine instance |

## 3. Field Management

The following methods provide comprehensive field definition capabilities for table creation.

### 3.1. Adding Fields

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

## 4. Key Operations

The following methods provide primary key, unique key, and foreign key management for table creation.

### 4.1. Adding Primary Keys

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

### 4.2. Adding Unique Keys

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

### 4.3. Adding Foreign Keys

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

## 5. Index Management

The following methods provide index creation capabilities for improved query performance.

### 5.1. Adding Indexes

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

## 6. Table Configuration

The following methods provide table-level configuration options for database-specific features.

### 6.1. Setting Table Engine (MySQL)

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

### 6.2. Setting Table Charset (MySQL)

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

### 6.3. Setting Table Collation (MySQL)

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

## 7. Getting Query Information

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

## 8. Common Data Types

The Create builder supports various SQL data types that work across different database engines:

### 8.1. Numeric Types

**Usage**

```typescript
.addField('id', { type: 'INTEGER', autoIncrement: true })
.addField('age', { type: 'SMALLINT', unsigned: true })
.addField('price', { type: 'DECIMAL', precision: 10, scale: 2 })
.addField('rating', { type: 'FLOAT' })
.addField('score', { type: 'DOUBLE' })
```

### 8.2. String Types

**Usage**

```typescript
.addField('name', { type: 'VARCHAR', length: 255 })
.addField('code', { type: 'CHAR', length: 10 })
.addField('description', { type: 'TEXT' })
.addField('content', { type: 'LONGTEXT' }) // MySQL
```

### 8.3. Date and Time Types

**Usage**

```typescript
.addField('birth_date', { type: 'DATE' })
.addField('login_time', { type: 'TIME' })
.addField('created_at', { type: 'DATETIME' })
.addField('updated_at', { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' })
```

### 8.4. Boolean and Binary Types

**Usage**

```typescript
.addField('active', { type: 'BOOLEAN', default: true })
.addField('data', { type: 'BLOB' })
.addField('config', { type: 'JSON' }) // MySQL/PostgreSQL
.addField('metadata', { type: 'JSONB' }) // PostgreSQL
```

## 9. Database-Specific Features

The following features demonstrate database-specific capabilities and optimizations.

### 9.1. MySQL Features

**Usage**

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

### 9.2. PostgreSQL Features

**Usage**

```typescript
await engine.create('users')
  .addField('id', { type: 'SERIAL', primaryKey: true })
  .addField('name', { type: 'VARCHAR', length: 255 })
  .addField('data', { type: 'JSONB' })
  .addField('tags', { type: 'TEXT[]' }); // Array type
```

### 9.3. SQLite Features

**Usage**

```typescript
await engine.create('users')
  .addField('id', { type: 'INTEGER', primaryKey: true, autoIncrement: true })
  .addField('name', { type: 'TEXT' })
  .addField('data', { type: 'TEXT' }) // JSON as TEXT
  .addField('created_at', { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' });
```

## 10. Type Safety

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

## 11. Error Handling

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

**Complete Example**

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
