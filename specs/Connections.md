# Connection Classes

Connection classes provide database-specific implementations for interacting with different SQL engines. Each connection class implements the `Connection` interface from the Inquire library, ensuring a consistent API across all supported databases.

## Table of Contents

 1. [Overview](#1-overview)
 2. [Mysql2Connection](#2-mysql2connection)
 3. [PGConnection](#3-pgconnection)
 4. [PGLiteConnection](#4-pgliteconnection)
 5. [BetterSqlite3Connection](#5-bettersqlite3connection)
 6. [Common Interface](#6-common-interface)
 7. [Database-Specific Features](#7-database-specific-features)

## 1. Overview

This section provides an overview of the available connection classes and their specific database implementations. Each connection class is designed to work with a particular database engine while maintaining a consistent interface.

Inquire supports multiple database engines through dedicated connection packages:

 - **Mysql2Connection** - MySQL via `@stackpress/inquire-mysql2`
 - **PGConnection** - PostgreSQL via `@stackpress/inquire-pg`
 - **PGLiteConnection** - PGLite via `@stackpress/inquire-pglite`
 - **BetterSqlite3Connection** - SQLite via `@stackpress/inquire-sqlite3`

## 2. Mysql2Connection

The `Mysql2Connection` class provides a connection interface for interacting with MySQL databases using the mysql2 library. This connection class handles MySQL-specific data formatting and query execution patterns.

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

### 2.1. Properties

The following properties are available when using Mysql2Connection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Mysql) |
| `lastId` | `number\|string\|undefined` | The last inserted ID from the database |

### 2.2. Methods

The following methods provide MySQL-specific functionality for query execution and data management.

#### 2.2.1. Formatting Queries

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

#### 2.2.2. Executing Queries

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

#### 2.2.3. Managing Transactions

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

## 3. PGConnection

The `PGConnection` class provides a connection interface for interacting with PostgreSQL databases. This connection class handles PostgreSQL-specific parameter placeholders and advanced features.

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

### 3.1. Properties

The following properties are available when using PGConnection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Pgsql) |

### 3.2. Methods

The following methods provide PostgreSQL-specific functionality for query execution and advanced database operations.

#### 3.2.1. Formatting Queries

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

#### 3.2.2. Executing Queries

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

#### 3.2.3. Managing Transactions

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

## 4. PGLiteConnection

The `PGLiteConnection` class provides a connection interface for interacting with PGLite databases. This connection class offers PostgreSQL compatibility in a lightweight, client-side environment.

```typescript
import { PGlite } from '@electric-sql/pglite';
import connect from '@stackpress/inquire-pglite';

const db = new PGlite();
const engine = connect(db);
```

### 4.1. Properties

The following properties are available when using PGLiteConnection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Pgsql) |

### 4.2. Methods

The following methods provide PGLite-specific functionality optimized for client-side and edge environments.

#### 4.2.1. Formatting Queries

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

#### 4.2.2. Executing Queries

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

#### 4.2.3. Managing Transactions

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

## 5. BetterSqlite3Connection

The `BetterSqlite3Connection` class provides a connection interface for interacting with SQLite databases using the better-sqlite3 library. This connection class handles SQLite-specific data type conversions and synchronous operations.

```typescript
import sqlite from 'better-sqlite3';
import connect from '@stackpress/inquire-sqlite3';

const db = sqlite(':memory:');
const engine = connect(db);
```

### 5.1. Properties

The following properties are available when using BetterSqlite3Connection.

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `Dialect` | The SQL dialect used by the connection (Sqlite) |
| `lastId` | `number\|string\|undefined` | The last inserted row ID from the database |

### 5.2. Methods

The following methods provide SQLite-specific functionality for efficient local database operations.

#### 5.2.1. Formatting Queries

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

#### 5.2.2. Executing Queries

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

#### 5.2.3. Managing Transactions

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

## 6. Common Interface

All connection classes implement the same `Connection<R>` interface, providing consistent functionality across different database engines. This unified interface ensures that switching between databases requires minimal code changes.

### 6.1. Core Methods

The following core methods are available across all connection implementations:

 - **`format(request: QueryObject)`** - Formats queries and values for the specific database
 - **`query<R>(request: QueryObject)`** - Executes queries and returns typed results
 - **`raw<R>(request: QueryObject)`** - Executes queries and returns raw database results
 - **`resource()`** - Returns the underlying database connection resource
 - **`transaction<R>(callback: Transaction<R>)`** - Manages database transactions

### 6.2. Type Safety

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

### 6.3. Error Handling

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

## 7. Database-Specific Features

Each connection class provides unique features tailored to its respective database engine. Understanding these differences helps in choosing the right database for your application needs.

### 7.1. MySQL Features

MySQL connections provide the following specific capabilities:

 - **Auto-increment tracking**: Automatically tracks `lastId` for inserted records
 - **Date handling**: Converts JavaScript Date objects to ISO strings
 - **Transaction support**: Uses `BEGIN`, `COMMIT`, and `ROLLBACK`

### 7.2. PostgreSQL Features

PostgreSQL connections offer advanced database functionality:

 - **Parameter placeholders**: Converts `?` placeholders to `$1`, `$2`, etc.
 - **Strict parameter matching**: Validates that query placeholders match provided values
 - **Transaction support**: Uses `BEGIN`, `COMMIT`, and `ROLLBACK`

### 7.3. SQLite Features

SQLite connections provide lightweight, local database capabilities:

 - **Boolean conversion**: Converts boolean values to numbers (0/1)
 - **Row ID tracking**: Automatically tracks `lastInsertRowid`
 - **Query optimization**: Uses `stmt.all()` for SELECT queries and `stmt.run()` for others
 - **Transaction support**: Uses `BEGIN TRANSACTION`, `COMMIT`, and `ROLLBACK`

### 7.4. PGLite Features

PGLite connections combine PostgreSQL compatibility with client-side optimization:

 - **PostgreSQL compatibility**: Uses PostgreSQL syntax and parameter placeholders
 - **Lightweight**: Optimized for client-side and edge environments
 - **Exec optimization**: Uses `exec()` for queries without parameters
