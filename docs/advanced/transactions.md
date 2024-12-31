# Transactions

## Overview

Transactions ensure that multiple database operations are executed atomically. Inquire provides a simple way to work with transactions.

## Basic Usage

```typescript
import { createInquire } from '@stackpress/inquire';
import { PostgresAdapter } from '@stackpress/inquire-pg';

const db = createInquire({
  adapter: new PostgresAdapter({
    // connection config
  })
});

// Using async/await
await db.transaction(async (trx) => {
  const user = await trx
    .insertInto('users')
    .values({ name: 'John', email: 'john@example.com' })
    .returning('*')
    .execute();

  await trx
    .insertInto('profiles')
    .values({ user_id: user.id, bio: 'Hello!' })
    .execute();
});
```

## Nested Transactions

```typescript
await db.transaction(async (trx1) => {
  await trx1
    .insertInto('users')
    .values({ name: 'John' })
    .execute();

  await trx1.transaction(async (trx2) => {
    await trx2
      .insertInto('profiles')
      .values({ user_id: user.id })
      .execute();
  });
});
```

## Transaction Configuration

```typescript
interface TransactionConfig {
  isolationLevel?: IsolationLevel;
  readOnly?: boolean;
  deferrable?: boolean;
}

await db.transaction({
  isolationLevel: 'serializable',
  readOnly: true
}, async (trx) => {
  // transaction code
});
```

## Error Handling

```typescript
try {
  await db.transaction(async (trx) => {
    // If any operation fails, the entire transaction is rolled back
    await trx.insertInto('users').values({ /* ... */ }).execute();
    await trx.insertInto('profiles').values({ /* ... */ }).execute();
  });
} catch (error) {
  console.error('Transaction failed:', error);
}
```

## Best Practices

1. Keep transactions as short as possible
2. Handle errors appropriately
3. Choose the right isolation level
4. Avoid mixing transactional and non-transactional operations
5. Be aware of deadlock scenarios
