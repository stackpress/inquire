# Quick Start

Get from zero to a working query with one table, one insert, and one typed select.

This tutorial uses `better-sqlite3` because it is the shortest local setup path. The same `Engine` and builder APIs work with the MySQL, PostgreSQL, and PGlite connection packages.

## Before you start

- Node.js 22 or newer
- `yarn`
- `better-sqlite3`
- `@stackpress/inquire`
- `@stackpress/inquire-sqlite3`

```bash
yarn add @stackpress/inquire @stackpress/inquire-sqlite3 better-sqlite3
```

## 1. Create an engine

```ts
import sqlite from 'better-sqlite3';
import connect from '@stackpress/inquire-sqlite3';

const resource = sqlite(':memory:');
const engine = connect(resource);
```

`connect()` wraps the native driver and gives you an `Engine` that speaks the right SQL dialect.

## 2. Create a table

```ts
await engine.create('users')
  .addField('id', { type: 'integer', autoIncrement: true })
  .addField('email', { type: 'string', length: 255, nullable: false })
  .addField('name', { type: 'string', length: 255, nullable: false })
  .addField('active', { type: 'boolean', default: true })
  .addPrimaryKey('id')
  .addUniqueKey('users_email_unique', 'email');
```

`create()` returns an awaitable builder. When you `await` it, Inquire generates SQL for the current dialect and runs it in a transaction.

## 3. Insert rows

```ts
await engine.insert('users').values([
  { email: 'ada@example.com', name: 'Ada', active: true },
  { email: 'grace@example.com', name: 'Grace', active: false }
]);
```

`insert()` also returns an awaitable builder. Use `.values()` with one object or an array of objects.

## 4. Query typed results

```ts
type UserRow = {
  id: number;
  email: string;
  name: string;
  active: number;
};

const users = await engine.select<UserRow>([
    'id',
    'email',
    'name',
    'active'
  ])
  .from('users')
  .where('active = ?', [1])
  .order('name');

console.log(users);
```

With SQLite, booleans are stored as integers. Other dialects may format the same value differently, but the builder API stays the same.

## 5. Verify the result

You should get one row back for `Ada`.

If that works, you have the main flow:

- schema creation with `create()`
- writes with `insert()`
- typed reads with `select<T>()`

## What just happened

- The connection package chose the dialect for you.
- The `Engine` created builders for schema and query operations.
- Each builder stayed plain and explicit. You defined table names, columns, and filters yourself.
- No model layer was created. Inquire helps you build SQL. It does not act like an ORM.

## Next steps

- Read [Mental model](../explanation/mental-model.md) to understand the moving parts.
- Read [Schema changes](../guides/schema-changes.md) to update existing tables.
- Read [Raw SQL and transactions](../guides/raw-sql-and-transactions.md) when you need custom SQL.
- Use the [API reference](../api/README.md) for exact method details.
