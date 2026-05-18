# Mysql

`Mysql` is the MySQL dialect object exported by `@stackpress/inquire`.

```ts
import Mysql from '@stackpress/inquire/Mysql';
```

## Properties

| Property | Value |
| --- | --- |
| `name` | `mysql` |
| `q` | `` ` `` |

The module also exports `typemap`.

## Type mapping highlights

- `json` -> `JSON`
- `boolean` -> `BOOLEAN`
- `integer` -> `INT`
- `datetime` -> `DATETIME`

## Behavior notes

- keeps `?` placeholders
- supports `AUTO_INCREMENT`
- uses backticks for identifier quoting
- supports JSON expression generation through `json(...)`

## Example

```ts
const request = engine.insert('users')
  .values({ email: 'ada@example.com' })
  .query(Mysql);
```

## Related

- [MySQL2 connection wrapper](../connections.md)
- [Dialects overview](./README.md)
