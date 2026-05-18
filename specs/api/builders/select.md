# Select

`Select` builds `SELECT` queries.

```ts
import Select from '@stackpress/inquire/Select';
```

Most code uses it through `engine.select(columns?)`.

## Example

```ts
const users = await engine.select<{ id: number; email: string }>([
    'users.id',
    'users.email'
  ])
  .from('users')
  .where('users.active = ?', [true])
  .order('users.email')
  .limit(10)
  .offset(20);
```

## Methods

### `from(table, alias?)`

Set the source table.

### `join(type, table, from, to)`

Add a join.

```ts
const query = engine.select('*')
  .from('users')
  .join('inner', 'profiles', 'profiles.user_id', 'users.id');
```

### `limit(limit)`

Set the row limit.

### `offset(offset)`

Set the row offset.

### `order(column, direction?)`

Add an `ORDER BY` clause. Default direction is `ASC`.

### `select(columns)`

Replace the current selector list.

`columns` can be:

- a string
- a comma-separated string
- an array of strings or selector objects

### `where(clause, values?)`

Add a `WHERE` clause.

### `whereJson(query, selector, value)`

Add a JSON comparison filter.

### `whereJsonContains(selector, value)`

Add a JSON containment filter.

### `build()`

Return the internal select state.

### `query(dialect?)`

Return one `QueryObject`.

### `then(resolve, reject?)`

Execute the query through the attached engine.

## Returns

When awaited, `Select<R>` resolves to `R[]`.

## Related

- [JSON fields and filters](../../guides/json-fields-and-filters.md)
- [Engine](../engine.md)
