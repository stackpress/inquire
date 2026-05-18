# Raw SQL and Transactions

Use this guide when the builder surface is not enough or when you need explicit transaction control around multiple operations.

## Run a raw query

Use `engine.query()` when you already have the SQL string.

```ts
type UserRow = {
  id: number;
  email: string;
};

const rows = await engine.query<UserRow>(
  'SELECT id, email FROM users WHERE id = ?',
  [1]
);
```

You can also pass a query object.

```ts
const rows = await engine.query<UserRow>({
  query: 'SELECT id, email FROM users WHERE id = ?',
  values: [1]
});
```

## Use a template string

Use `engine.sql` for small hand-written queries.

```ts
const rows = await engine.sql<{ id: number }>`
  SELECT id
  FROM users
  WHERE email LIKE ${'%@example.com'}
`;
```

Inquire converts interpolated values into placeholders for the active dialect.

## Use `??` when you need a literal question mark

PostgreSQL-family connection wrappers temporarily protect `??` while they rewrite value placeholders from `?` to `$1`, `$2`, and so on.

This is only useful in edge cases. Prefer builders when quoting or placeholder behavior matters.

## Wrap work in a transaction

Use `engine.transaction()` when multiple operations must succeed or fail together.

```ts
await engine.transaction(async (tx) => {
  await tx.query({
    query: 'INSERT INTO users (email) VALUES (?)',
    values: ['ada@example.com']
  });

  await tx.query({
    query: 'INSERT INTO profiles (user_id) VALUES (?)',
    values: [1]
  });
});
```

The connection wrapper decides how `BEGIN`, `COMMIT`, and `ROLLBACK` are implemented for the native driver.

## Add request hooks

Both `Engine` and connection wrappers expose a `before` hook for last-minute request handling.

```ts
engine.before = async (request) => {
  console.log(request.query, request.values);
};
```

Use this for logging, instrumentation, or request mutation. Keep it small and predictable.
