# Delete

`Delete` builds `DELETE` queries.

```ts
import Delete from '@stackpress/inquire/Delete';
```

Most code uses it through `engine.delete(table)`.

## Example

```ts
await engine.delete('sessions')
  .where('expires_at < ?', [new Date()]);
```

## Methods

### `where(query, values?)`

Add a `WHERE` clause.

### `whereJson(query, selector, value)`

Add a JSON comparison filter.

### `whereJsonContains(selector, value)`

Add a JSON containment filter.

### `build()`

Return the internal delete state.

### `query(dialect?)`

Return one `QueryObject`.

### `then(resolve, reject?)`

Execute the query through the attached engine.

## Special properties

`Delete` also exposes writable configuration properties:

| Property | Default |
| --- | --- |
| `selector` | `:` |
| `separator` | `.` |

These affect JSON selector parsing.

## Returns

When awaited, `Delete<R>` resolves to `R[]`.

## Related

- [Update](./update.md)
- [JSON fields and filters](../../guides/json-fields-and-filters.md)
