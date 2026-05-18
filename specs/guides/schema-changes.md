# Schema Changes

Use this guide when you need to define or change tables without adding a separate migration framework.

## Create a table

```ts
await engine.create('posts')
  .addField('id', { type: 'integer', autoIncrement: true })
  .addField('user_id', { type: 'integer', nullable: false })
  .addField('title', { type: 'string', length: 255, nullable: false })
  .addField('body', { type: 'text' })
  .addPrimaryKey('id')
  .addKey('posts_user_id_index', 'user_id')
  .addForeignKey('posts_user_id_fk', {
    local: 'user_id',
    foreign: 'id',
    table: 'users',
    delete: 'CASCADE'
  });
```

Use `create()` when the table does not exist yet.

## Alter a table

```ts
await engine.alter('posts')
  .addField('published_at', { type: 'datetime', nullable: true })
  .changeField('title', { type: 'string', length: 320, nullable: false })
  .addKey('posts_published_at_index', 'published_at');
```

Use `alter()` for incremental changes. The exact SQL depends on the active dialect.

## Diff two schemas

If you already know the current and target shape, let Inquire build the `Alter` plan for you.

```ts
const from = engine.create('users')
  .addField('id', { type: 'integer', autoIncrement: true })
  .addField('email', { type: 'string', length: 255 })
  .addPrimaryKey('id');

const to = engine.create('users')
  .addField('id', { type: 'integer', autoIncrement: true })
  .addField('email', { type: 'string', length: 320, nullable: false })
  .addField('name', { type: 'string', length: 255 })
  .addPrimaryKey('id');

const alter = engine.diff(from, to);
const statements = alter.query();
```

This is useful when your application defines schemas in code and you want a generated `Alter` builder.

## Rename, drop, and truncate tables

```ts
await engine.rename('draft_posts', 'posts');
await engine.truncate('logs');
await engine.drop('temporary_imports');
```

Use:

- `rename()` to rename a table
- `truncate()` to remove all rows quickly
- `drop()` to remove the table itself

`truncate()` accepts a second `cascade` argument for dialects that support it.

## Inspect generated SQL before execution

Builders can be used without executing them immediately.

```ts
const create = engine.create('audit_logs')
  .addField('id', { type: 'integer', autoIncrement: true })
  .addField('payload', { type: 'json' })
  .addPrimaryKey('id');

const statements = create.query();
```

That is useful when you want to log, review, or test the emitted SQL.

## Notes by dialect

- PostgreSQL emits multiple `ALTER TABLE` statements for some changes.
- SQLite supports fewer direct alter operations than MySQL or PostgreSQL.
- Auto-increment and default handling vary by dialect.

See the [dialect reference](../api/dialects/README.md) before relying on a database-specific behavior.
