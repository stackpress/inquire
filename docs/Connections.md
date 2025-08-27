# Connection Classes

Connection classes provide database-specific implementations for interacting with different SQL engines. Each connection class implements the `Connection` interface from the Inquire library, ensuring a consistent API across all supported databases.

## Overview

Inquire supports multiple database engines through dedicated connection packages:

- **Mysql2Connection** - MySQL via `@stackpress/inquire-mysql2`
- **PGConnection** - PostgreSQL via `@stackpress/inquire-pg`
- **PGLiteConnection** - PGLite via `@stackpress/inquire-pglite`
- **BetterSqlite3Connection** - SQLite via `@stackpress/inquire-sqlite3`

## Mysql2Connection

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

### Properties

The following properties are available when using Mysql2Connection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Mysql) |
| `lastId` | `number\|string\|undefined` | The last inserted ID from the database |

### Methods

#### Formatting Queries

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

#### Executing Queries

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

#### Managing Transactions

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

## PGConnection

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

### Properties

The following properties are available when using PGConnection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Pgsql) |

### Methods

#### Formatting Queries

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

#### Executing Queries

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

#### Managing Transactions

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

## PGLiteConnection

The `PGLiteConnection` class provides a connection interface for interacting with PGLite databases.

```typescript
import { PGlite } from '@electric-sql/pglite';
import connect from '@stackpress/inquire-pglite';

const db = new PGlite();
const engine = connect(db);
```

### Properties

The following properties are available when using PGLiteConnection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Pgsql) |

### Methods

#### Formatting Queries

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

#### Executing Queries

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

#### Managing Transactions

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

## BetterSqlite3Connection

The `BetterSqlite3Connection` class provides a connection interface for interacting with SQLite databases using the better-sqlite3 library.

```typescript
import sqlite from 'better-sqlite3';
import connect from '@stackpress/inquire-sqlite3';

const db = sqlite(':memory:');
const engine = connect(db);
```

### Properties

The following properties are available when using BetterSqlite3Connection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Sqlite) |
| `lastId` | `number\|string\|undefined` | The last inserted row ID from the database |

### Methods

#### Formatting Queries

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

#### Executing Queries

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

#### Managing Transactions

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

## Common Interface

All connection classes implement the same `Connection<R>` interface, providing:

### Core Methods

- **`format(request: QueryObject)`** - Formats queries and values for the specific database
- **`query<R>(request: QueryObject)`** - Executes queries and returns typed results
- **`raw<R>(request: QueryObject)`** - Executes queries and returns raw database results
- **`resource()`** - Returns the underlying database connection resource
- **`transaction<R>(callback: Transaction<R>)`** - Manages database transactions

### Type Safety

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

### Error Handling

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

## Database-Specific Features

### MySQL Features

- **Auto-increment tracking**: Automatically tracks `lastId` for inserted records
- **Date handling**: Converts JavaScript Date objects to ISO strings
- **Transaction support**: Uses `BEGIN`, `COMMIT`, and `ROLLBACK`

### PostgreSQL Features

- **Parameter placeholders**: Converts `?` placeholders to `$1`, `$2`, etc.
- **Strict parameter matching**: Validates that query placeholders match provided values
- **Transaction support**: Uses `BEGIN`, `COMMIT`, and `ROLLBACK`

### SQLite Features

- **Boolean conversion**: Converts boolean values to numbers (0/1)
- **Row ID tracking**: Automatically tracks `lastInsertRowid`
- **Query optimization**: Uses `stmt.all()` for SELECT queries and `stmt.run()` for others
- **Transaction support**: Uses `BEGIN TRANSACTION`, `COMMIT`, and `ROLLBACK`

### PGLite Features

- **PostgreSQL compatibility**: Uses PostgreSQL syntax and parameter placeholders
- **Lightweight**: Optimized for client-side and edge environments
- **Exec optimization**: Uses `exec()` for queries without parameters
