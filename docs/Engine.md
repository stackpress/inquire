# Engine

The `Engine` class serves as the core component for building and executing SQL queries. It provides a unified interface for various SQL operations, abstracting the underlying database engine while maintaining type safety.

```typescript
import { Engine } from '@stackpress/inquire';
import connect from '@stackpress/inquire-mysql2';

const engine = connect(connection);
```

## Properties

The following properties are available when instantiating an Engine.

| Property | Type | Description |
|----------|------|-------------|
| `connection` | `Connection<R>` | The database connection used by the engine |
| `dialect` | `Dialect` | Returns the SQL dialect associated with the connection |

## Methods

The following methods are available when instantiating an Engine.

### Creating Tables

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

### Altering Tables

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

### Selecting Data

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

### Inserting Data

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

### Updating Data

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

### Deleting Data

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

### Executing Raw Queries

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

### Template String Queries

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

### Managing Transactions

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

### Dropping Tables

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

### Renaming Tables

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

### Truncating Tables

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

### Comparing Table Schemas

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

## Type Safety

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

## Error Handling

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