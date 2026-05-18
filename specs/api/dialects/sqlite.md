# Sqlite

`Sqlite` is the SQLite dialect object exported by `@stackpress/inquire`.

```ts
import Sqlite from '@stackpress/inquire/Sqlite';
```

## Properties

| Property | Value |
| --- | --- |
| `name` | `sqlite` |
| `q` | `` ` `` |

The module also exports `typemap`.

## Type mapping highlights

- `json` -> `TEXT`
- `boolean` -> `INTEGER`
- `integer` -> `INTEGER`
- `datetime` -> `INTEGER`

## Behavior notes

- keeps `?` placeholders
- converts booleans to integers at the connection layer
- uses backticks for identifier quoting
- supports fewer direct alter operations than MySQL or PostgreSQL

## Example

```ts
const request = engine.create('users')
  .addField('id', { type: 'integer', autoIncrement: true })
  .addPrimaryKey('id')
  .query(Sqlite);
```

## Related

- [better-sqlite3 connection wrapper](../connections.md)
- [Dialects overview](./README.md)
