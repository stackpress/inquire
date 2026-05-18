# Connections

Connection wrappers adapt a native driver to Inquire's `Connection` interface.

Each wrapper:

- exposes a dialect
- formats values for the native driver
- executes SQL
- manages transactions
- returns plain result arrays from `query()`

## Shared interface

All connection wrappers implement the same core shape.

| Property or method | Description |
| --- | --- |
| `dialect` | Active SQL dialect. |
| `lastId` | Last inserted id when the driver exposes one. |
| `before` | Hook that runs before the native query call. |
| `format(request)` | Adapts placeholders and values for the driver. |
| `query(request)` | Returns plain rows for application code. |
| `resource()` | Returns the native resource. |
| `transaction(callback)` | Runs work in a transaction. |

Some wrappers also expose a `raw()` method on the concrete class, but that method is not part of the shared `Connection` interface.

## MySQL2

Package: `@stackpress/inquire-mysql2`

```ts
import mysql from 'mysql2/promise';
import connect from '@stackpress/inquire-mysql2';

const resource = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'app'
});

const engine = connect(resource);
```

Concrete class: `Mysql2Connection`

Notes:

- uses the `Mysql` dialect
- tracks `lastId`
- serializes dates, arrays, and objects in `format()`
- uses native `beginTransaction()`, `commit()`, and `rollback()`

## PostgreSQL

Package: `@stackpress/inquire-pg`

```ts
import { Client } from 'pg';
import connect from '@stackpress/inquire-pg';

const client = new Client({
  database: 'app',
  user: 'postgres'
});

await client.connect();

const engine = connect(client);
```

Concrete class: `PGConnection`

Notes:

- uses the `Pgsql` dialect
- rewrites `?` placeholders to `$1`, `$2`, and so on
- serializes dates, arrays, and objects in `format()`
- does not expose `lastId`

## PGlite

Package: `@stackpress/inquire-pglite`

```ts
import { PGlite } from '@electric-sql/pglite';
import connect from '@stackpress/inquire-pglite';

const resource = new PGlite('./build/database');
const engine = connect(resource);
```

Concrete class: `PGLiteConnection`

Notes:

- uses the `Pgsql` dialect
- shares the same placeholder conversion rules as PostgreSQL
- does not expose `lastId`

## better-sqlite3

Package: `@stackpress/inquire-sqlite3`

```ts
import sqlite from 'better-sqlite3';
import connect from '@stackpress/inquire-sqlite3';

const resource = sqlite(':memory:');
const engine = connect(resource);
```

Concrete class: `BetterSqlite3Connection`

Notes:

- uses the `Sqlite` dialect
- converts booleans to `0` or `1`
- tracks `lastId` through `lastInsertRowid`
- treats `SELECT` and `INSERT ... RETURNING` as row-returning queries

## When to work at this level

Most application code should stay at the `Engine` level. Use the connection classes directly only when you need driver-specific behavior such as `raw()` access or direct access to the native `resource()`.
