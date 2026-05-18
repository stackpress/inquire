# Update

`Update` builds `UPDATE` queries.

```ts
import Update from '@stackpress/inquire/Update';
```

Most code uses it through `engine.update(table)`.

## Example

```ts
await engine.update('users')
  .set({ active: false })
  .where('last_login < ?', [new Date('2024-01-01')]);
```

## Methods

### `set(data)`

Set the column values to update.

### `where(query, values?)`

Add a `WHERE` clause.

### `whereJson(query, selector, value)`

Add a JSON comparison filter.

### `whereJsonContains(selector, value)`

Add a JSON containment filter.

### `build()`

Return the internal update state.

### `query(dialect?)`

Return one `QueryObject`.

### `then(resolve, reject?)`

Execute the query through the attached engine.

## Special properties

`Update` also exposes writable configuration properties:

| Property | Default |
| --- | --- |
| `selector` | `:` |
| `separator` | `.` |

These affect JSON selector parsing.

## Returns

When awaited, `Update<R>` resolves to `R[]`.

## Related

- [JSON fields and filters](../../guides/json-fields-and-filters.md)
- [Delete](./delete.md)
