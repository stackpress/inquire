# MySQL Dialect

MySQL-specific SQL dialect implementation for converting query builders to MySQL-compatible SQL statements with proper syntax, data types, and features.

```typescript
import { Mysql } from '@stackpress/inquire';
import Engine from '@stackpress/inquire';

// Using MySQL dialect directly
const engine = new Engine(connection, Mysql);

// Or access through engine
const { query, values } = engine.select().from('users').query(Mysql);
```

## Properties

The following properties are available in the MySQL dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for identifiers (backtick: `) |

## Static Properties

The following properties can be accessed directly from the MySQL dialect.

| Property | Type | Description |
|----------|------|-------------|
| `q` | `string` | Quote character for MySQL identifiers (`) |
| `typemap` | `Record<string, string>` | Mapping of generic types to MySQL-specific types |

## Methods

The following methods are available in the MySQL dialect for converting query builders to SQL.

### Converting ALTER Queries

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

### Converting CREATE Queries

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

### Converting DELETE Queries

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

### Converting INSERT Queries

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

### Converting SELECT Queries

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

### Converting UPDATE Queries

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

### Dropping Tables

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

### Renaming Tables

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

### Truncating Tables

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

## MySQL-Specific Features

### Data Type Mapping

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

### Integer Type Optimization

The MySQL dialect automatically optimizes integer types based on length.

```typescript
// Automatic integer type selection
engine.create('users')
  .field('flag', { type: 'int', length: 1 })    // Becomes TINYINT
  .field('id', { type: 'int', length: 11 })     // Becomes INT
  .field('big_id', { type: 'int', length: 20 }) // Becomes BIGINT
  .field('count', { type: 'int' });             // Becomes INT(11) - default
```

### Field Attributes

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

### Index and Constraint Support

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

### JOIN Support

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

### Identifier Quoting

MySQL dialect uses backticks for identifier quoting to handle reserved words and special characters.

```typescript
// All identifiers are properly quoted
const { query } = engine.select('order', 'group', 'select')
  .from('user-table')
  .where('`order` = ?', [1])
  .query(Mysql);

// Generates: SELECT `order`, `group`, `select` FROM `user-table` WHERE `order` = ?
```

## Advanced MySQL Features

### Multi-Table Operations

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

### MySQL-Specific Functions

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

### Storage Engine Options

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

## Error Handling

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

## Performance Considerations

### Query Optimization

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

### Bulk Operations

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
