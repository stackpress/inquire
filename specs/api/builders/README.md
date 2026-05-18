# Builders

Builders collect query intent and either:

- expose it with `.build()`
- convert it to SQL with `.query()`
- execute it when awaited, if they were created by an `Engine`

## Schema builders

- [Create](./create.md)
- [Alter](./alter.md)

## Query builders

- [Select](./select.md)
- [Insert](./insert.md)
- [Update](./update.md)
- [Delete](./delete.md)

## Common behavior

Most builders share these patterns:

| Method | Description |
| --- | --- |
| `build()` | Returns a plain object representation of the builder state. |
| `query(dialect?)` | Returns SQL for the provided or engine dialect. |
| `then(...)` | Makes the builder awaitable when an engine is attached. |

The exact shape of `build()` and `query()` depends on the builder.
