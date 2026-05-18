# Pgsql

`Pgsql` is the PostgreSQL dialect object exported by `@stackpress/inquire`.

```ts
import Pgsql from '@stackpress/inquire/Pgsql';
```

## Properties

| Property | Value |
| --- | --- |
| `name` | `pgsql` |
| `q` | `"` |

The module also exports `typemap`.

## Type mapping highlights

- `json` -> `JSONB`
- `boolean` -> `BOOLEAN`
- `integer` -> `INTEGER`
- `datetime` -> `TIMESTAMP`

## Behavior notes

- connection wrappers rewrite `?` placeholders to `$1`, `$2`, and so on
- uses `SERIAL` for auto-increment fields
- uses double quotes for identifier quoting
- supports JSON expression generation through `json(...)`

## Example

```ts
const request = engine.select('*')
  .from('users')
  .where('id = ?', [1])
  .query(Pgsql);
```

## Related

- [PostgreSQL and PGlite connection wrappers](../connections.md)
- [Dialects overview](./README.md)
