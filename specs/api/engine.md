# Engine

`Engine` is the main entry point for schema changes, query builders, raw SQL, and transactions.

```ts
import Engine from '@stackpress/inquire/Engine';
```

Most applications will get an engine from a connection package:

```ts
import connect from '@stackpress/inquire-sqlite3';

const engine = connect(resource);
```

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `connection` | `Connection<R>` | The wrapped connection implementation. |
| `dialect` | `Dialect` | The dialect exposed by the connection. |
| `before` | `(request: QueryObject) => Promise<R[] \| void>` | Hook that runs before `engine.query()` calls the connection. |

## Builder methods

### `alter(table)`

Create an [Alter](./builders/alter.md) builder.

```ts
const alter = engine.alter('users');
```

### `create(table)`

Create a [Create](./builders/create.md) builder.

```ts
const create = engine.create('users');
```

### `delete(table)`

Create a [Delete](./builders/delete.md) builder.

```ts
const remove = engine.delete('users');
```

### `insert(table)`

Create an [Insert](./builders/insert.md) builder.

```ts
const insert = engine.insert('users');
```

### `select(columns?)`

Create a [Select](./builders/select.md) builder.

```ts
const select = engine.select(['id', 'email']);
```

### `update(table)`

Create an [Update](./builders/update.md) builder.

```ts
const update = engine.update('users');
```

## Table helpers

### `diff(from, to)`

Compare two `Create` builders and return an `Alter` builder.

```ts
const alter = engine.diff(fromSchema, toSchema);
const statements = alter.query();
```

Use this when your source of truth is a pair of schema definitions.

### `drop(table)`

Drop a table.

```ts
await engine.drop('temporary_imports');
```

### `rename(from, to)`

Rename a table.

```ts
await engine.rename('draft_posts', 'posts');
```

### `truncate(table, cascade?)`

Remove all rows from a table.

```ts
await engine.truncate('logs');
await engine.truncate('events', true);
```

Support for `cascade` depends on the active dialect.

## Raw query methods

### `query(query, values?)`

Execute a raw SQL string or a `QueryObject`.

```ts
const rows = await engine.query<{ id: number }>(
  'SELECT id FROM users WHERE id = ?',
  [1]
);
```

### `sql(strings, ...values)`

Execute a template-string query.

```ts
const rows = await engine.sql<{ id: number }>`
  SELECT id FROM users WHERE id = ${1}
`;
```

Backticks inside the SQL string are rewritten to the dialect quote character.

## Transaction method

### `transaction(callback)`

Run work inside the connection wrapper's transaction implementation.

```ts
await engine.transaction(async (tx) => {
  await tx.query({ query: 'INSERT INTO users (email) VALUES (?)', values: ['ada@example.com'] });
});
```

## Related

- [Builders overview](./builders/README.md)
- [Connections](./connections.md)
- [Dialects overview](./dialects/README.md)
