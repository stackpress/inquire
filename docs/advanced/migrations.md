# Database Migrations

## Overview

Migrations help you manage database schema changes over time. Inquire provides a simple yet powerful migration system.

## Creating Migrations

```typescript
import { createMigration } from '@stackpress/inquire';

export default createMigration({
  name: '20240101_create_users',
  
  async up(db) {
    await db.schema.createTable('users', table => {
      table.increments('id').primary();
      table.string('name').notNull();
      table.string('email').unique().notNull();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  },
  
  async down(db) {
    await db.schema.dropTable('users');
  }
});
```

## Running Migrations

```typescript
import { createInquire } from '@stackpress/inquire';
import { PostgresAdapter } from '@stackpress/inquire-pg';

const db = createInquire({
  adapter: new PostgresAdapter({
    // connection config
  })
});

// Run all pending migrations
await db.migrate.latest();

// Rollback last batch of migrations
await db.migrate.rollback();

// Run specific migration
await db.migrate.up('20240101_create_users');
```

## Migration File Structure

```
migrations/
├── 20240101_create_users.ts
├── 20240102_create_posts.ts
└── 20240103_add_user_status.ts
```

## Best Practices

1. **Atomic Changes**: Each migration should handle one schema change
2. **Reversible**: Always implement both `up` and `down` methods
3. **Idempotent**: Migrations should be safe to run multiple times
4. **Dependencies**: Order migrations correctly using timestamps
5. **Testing**: Test both `up` and `down` migrations
