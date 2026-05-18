# Mental Model

Inquire is a SQL builder, not an ORM.

That distinction matters because it explains both the strengths and the limits of the library.

## What Inquire does

Inquire gives you:

- schema builders for `create()` and `alter()`
- query builders for `select()`, `insert()`, `update()`, and `delete()`
- a shared `Engine` API across dialects
- connection wrappers that adapt native drivers
- typed query results through TypeScript generics

## What Inquire does not do

Inquire does not give you:

- model classes
- relationship mapping
- identity maps
- change tracking
- lazy loading
- domain architecture

You still decide how your application is structured. That is intentional.

## The four main parts

### Engine

`Engine` is the entry point. It creates builders, runs raw queries, and exposes table-level helpers such as `drop()`, `rename()`, and `truncate()`.

### Builders

Builders hold intent until you ask for SQL or execute them.

- `Create` and `Alter` are for schema changes.
- `Select`, `Insert`, `Update`, and `Delete` are for data access.

Each builder can:

- collect state
- generate SQL with `.query()`
- expose its internal shape with `.build()`
- execute when awaited, if it has an engine

### Dialects

Dialects translate builder state into SQL.

- `Mysql`
- `Pgsql`
- `Sqlite`

They handle differences such as identifier quoting, placeholder syntax, type mapping, JSON extraction, `RETURNING`, and `TRUNCATE`.

### Connections

A connection wrapper adapts a native driver to Inquire's `Connection` interface. It is responsible for:

- formatting values for that driver
- running the query
- handling transactions
- exposing the active dialect

## Why this design is useful

This design keeps SQL visible.

You can:

- keep your own repository or service layer
- inspect generated SQL before execution
- fall back to raw SQL at any time
- stay close to the underlying database

That makes Inquire a good fit when you want a small abstraction over SQL, not a system that designs your data layer for you.

## Typical workflow

```ts
const engine = connect(resource);

await engine.create('users')
  .addField('id', { type: 'integer', autoIncrement: true })
  .addPrimaryKey('id');

await engine.insert('users').values({ id: 1 });

const rows = await engine.select<{ id: number }>('id').from('users');
```

The library stays focused on schema and query building. Everything above that level remains your decision.
