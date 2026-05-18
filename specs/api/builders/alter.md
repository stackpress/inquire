# Alter

`Alter` defines incremental schema changes for an existing table.

```ts
import Alter from '@stackpress/inquire/Alter';
```

Most code uses it through `engine.alter(table)` or `engine.diff(from, to)`.

## Example

```ts
await engine.alter('users')
  .addField('nickname', { type: 'string', length: 255 })
  .changeField('email', { type: 'string', length: 320, nullable: false })
  .addKey('users_nickname_index', 'nickname');
```

## Methods

### Add operations

- `addField(name, field)`
- `addForeignKey(name, foreignKey)`
- `addKey(name, field)`
- `addPrimaryKey(name)`
- `addUniqueKey(name, field)`

### Remove operations

- `removeField(name)`
- `removeForeignKey(name)`
- `removeKey(name)`
- `removePrimaryKey(name)`
- `removeUniqueKey(name)`

### Change operations

- `changeField(name, field)`

### `build()`

Return the alter plan with grouped add, update, and remove operations.

### `query(dialect?)`

Return an array of `QueryObject` values for the target dialect.

### `then(resolve, reject?)`

Execute the generated statements through the attached engine in a transaction.

## Notes

- SQLite supports fewer direct alter operations than MySQL or PostgreSQL.
- `engine.diff()` is useful when you want to derive an `Alter` builder from two `Create` builders.

## Related

- [Create](./create.md)
- [Schema changes guide](../../guides/schema-changes.md)
