# Dialects

Dialects convert builder state into database-specific SQL.

The root package exports three dialect objects:

- `Mysql`
- `Pgsql`
- `Sqlite`

## Shared surface

Each dialect implements the `Dialect` interface and exposes:

| Member | Description |
| --- | --- |
| `name` | Dialect name used in logs and errors. |
| `q` | Preferred identifier quote character. |
| `alter(builder)` | Build schema alteration statements. |
| `create(builder)` | Build table creation statements. |
| `delete(builder)` | Build a delete statement. |
| `drop(table)` | Build a drop-table statement. |
| `insert(builder)` | Build an insert statement. |
| `json(...)` | Build dialect-specific JSON expressions. |
| `rename(from, to)` | Build a rename-table statement. |
| `select(builder)` | Build a select statement. |
| `truncate(table, cascade?)` | Build a truncate statement. |
| `update(builder)` | Build an update statement. |

## Type maps

Each dialect module also exports:

- `q`
- `typemap`

`typemap` translates generic field types such as `string`, `boolean`, `json`, and `datetime` into dialect-specific SQL types.

## Which one should you use?

Use the connection wrapper packages when possible. They pick the correct dialect automatically.

Use the dialect objects directly when you need to inspect generated SQL without executing it.

```ts
const query = engine.select('*').from('users').query(Pgsql);
```

## Reference pages

- [Mysql](./mysql.md)
- [Pgsql](./pgsql.md)
- [Sqlite](./sqlite.md)
