# API Reference

Use this section when you already know the task and need exact API details.

## Core

- [Engine](./engine.md)
- [Connections](./connections.md)

## Builders

- [Builders overview](./builders/README.md)
- [Create](./builders/create.md)
- [Alter](./builders/alter.md)
- [Select](./builders/select.md)
- [Insert](./builders/insert.md)
- [Update](./builders/update.md)
- [Delete](./builders/delete.md)

## Dialects

- [Dialects overview](./dialects/README.md)
- [Mysql](./dialects/mysql.md)
- [Pgsql](./dialects/pgsql.md)
- [Sqlite](./dialects/sqlite.md)

## Export surface

The root package exports:

- `Engine`
- `Alter`
- `Create`
- `Delete`
- `Insert`
- `Select`
- `Update`
- `Json`
- `Mysql`
- `Pgsql`
- `Sqlite`
- `Exception`
- selected helper functions and public types

Connection wrappers are published as separate packages:

- `@stackpress/inquire-mysql2`
- `@stackpress/inquire-pg`
- `@stackpress/inquire-pglite`
- `@stackpress/inquire-sqlite3`
