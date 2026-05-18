# Insert

`Insert` builds `INSERT` queries.

```ts
import Insert from '@stackpress/inquire/Insert';
```

Most code uses it through `engine.insert(table)`.

## Example

```ts
await engine.insert('users').values([
  { email: 'ada@example.com', name: 'Ada' },
  { email: 'grace@example.com', name: 'Grace' }
]);
```

## Methods

### `values(values)`

Set the rows to insert.

| Parameter | Type |
| --- | --- |
| `values` | `Record<string, Value> \| Record<string, Value>[]` |

### `returning(columns?)`

Request returned columns where the dialect supports it.

```ts
const rows = await engine.insert('users')
  .values({ email: 'ada@example.com' })
  .returning(['id', 'email']);
```

### `build()`

Return the internal insert state.

### `query(dialect?)`

Return one `QueryObject`.

### `then(resolve, reject?)`

Execute the query through the attached engine.

## Returns

When awaited, `Insert<R>` resolves to `R[]`.

For drivers without `RETURNING`, you will often get an empty array and inspect `connection.lastId` instead.

## Related

- [Connections](../connections.md)
- [Dialects overview](../dialects/README.md)
