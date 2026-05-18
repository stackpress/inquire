# JSON Fields and Filters

Use this guide when you store JSON in a column and still need to filter by nested values.

## Store JSON values

All supported connection wrappers format arrays and objects as JSON strings before execution.

```ts
await engine.insert('profiles').values({
  name: 'Ada',
  settings: {
    theme: 'dark',
    flags: ['beta']
  }
});
```

The underlying column type still depends on the dialect.

- MySQL maps `json` to `JSON`
- PostgreSQL maps `json` to `JSONB`
- SQLite maps `json` to `TEXT`

## Filter by a nested JSON value

Use `whereJson()` on `Select`, `Update`, or `Delete`.

```ts
const profiles = await engine.select('*')
  .from('profiles')
  .whereJson('=', ['settings:theme', '?'], 'dark');
```

The builder stores the JSON selector and lets the dialect translate it to native SQL.

## Filter by containment

Use `whereJsonContains()` when you want the dialect to perform a containment check.

```ts
const profiles = await engine.select('*')
  .from('profiles')
  .whereJsonContains('settings:flags', 'beta');
```

This is the most dialect-sensitive part of the builder surface. Test the emitted SQL against the database you actually use.

## Update or delete with JSON filters

The same JSON filter helpers exist on `Update` and `Delete`.

```ts
await engine.update('profiles')
  .set({ active: false })
  .whereJson('=', ['settings:theme', '?'], 'legacy');

await engine.delete('profiles')
  .whereJsonContains('settings:flags', 'deprecated');
```

## Choose selectors carefully

By default, selectors use:

- `:` to separate the column from the JSON path
- `.` to separate path segments

Example:

```text
settings:notifications.email
```

`Update` and `Delete` expose writable `selector` and `separator` properties if you need different notation before calling `.build()` or `.query()`.

## When to drop to raw SQL

Use raw SQL if:

- you need database-specific JSON functions
- you need JSON updates, not only JSON filters
- the exact SQL behavior matters more than cross-dialect consistency

See [Raw SQL and transactions](./raw-sql-and-transactions.md).
