# Installation Guide

## Package Installation

Inquire is distributed as multiple npm packages to keep your dependencies minimal. Start by installing the core package:

```bash
npm install @stackpress/inquire
```

## Database Adapters

Choose and install the adapter for your database:

### PostgreSQL

```bash
npm install @stackpress/inquire-pg
```

Example usage:
```typescript
import { createInquire } from '@stackpress/inquire';
import { PostgresAdapter } from '@stackpress/inquire-pg';

const db = createInquire({
  adapter: new PostgresAdapter({
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    user: 'postgres',
    password: 'password'
  })
});
```

### MySQL

```bash
npm install @stackpress/inquire-mysql2
```

Example usage:
```typescript
import { createInquire } from '@stackpress/inquire';
import { MySQL2Adapter } from '@stackpress/inquire-mysql2';

const db = createInquire({
  adapter: new MySQL2Adapter({
    host: 'localhost',
    port: 3306,
    database: 'myapp',
    user: 'root',
    password: 'password'
  })
});
```

### SQLite3

```bash
npm install @stackpress/inquire-sqlite3
```

Example usage:
```typescript
import { createInquire } from '@stackpress/inquire';
import { SQLite3Adapter } from '@stackpress/inquire-sqlite3';

const db = createInquire({
  adapter: new SQLite3Adapter({
    filename: ':memory:' // or path to your .db file
  })
});
```

## TypeScript Configuration

Inquire is written in TypeScript and provides full type definitions. Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "node"
  }
}
```

## Next Steps

- Follow the [Quick Start](/guide/quick-start) guide
- Learn about [Query Building](/guide/query-building)
- Explore [Database Adapters](/guide/adapters) in detail
