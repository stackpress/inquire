# Create

`Create` defines a new table schema.

```ts
import Create from '@stackpress/inquire/Create';
```

Most code uses it through `engine.create(table)`.

## Example

```ts
await engine.create('users')
  .addField('id', { type: 'integer', autoIncrement: true })
  .addField('email', { type: 'string', length: 255, nullable: false })
  .addPrimaryKey('id')
  .addUniqueKey('users_email_unique', 'email');
```

## Methods

### `addField(name, field)`

Add a field definition.

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | Column name. |
| `field` | `Field` | Field definition. |

### `addForeignKey(name, foreignKey)`

Add a foreign key definition.

### `addKey(name, field)`

Add a non-unique index. `field` can be a string or string array.

### `addPrimaryKey(name)`

Add one primary key column name. Call it multiple times for composite keys.

### `addUniqueKey(name, field)`

Add a unique key. `field` can be a string or string array.

### `build()`

Return the collected schema state.

### `query(dialect?)`

Return an array of `QueryObject` values for the target dialect.

**Returns**

An array because a table definition may need more than one statement.

### `then(resolve, reject?)`

Execute the generated statements through the attached engine.

**Returns**

A promise that resolves with the result of the last query in the transaction.

## Field shape

The shared `Field` type supports:

- `type`
- `length`
- `attribute`
- `default`
- `nullable`
- `unsigned`
- `autoIncrement`
- `comment`

Actual SQL support varies by dialect.

## Related

- [Alter](./alter.md)
- [Engine](../engine.md)
- [Dialects](../dialects/README.md)
