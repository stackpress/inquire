# CockroachDB Adapter

## Overview

CockroachDB is supported through the PostgreSQL adapter due to its PostgreSQL compatibility layer.

## Installation

```bash
npm install @stackpress/inquire @stackpress/inquire-pg
```

## Basic Configuration

```typescript
import { createInquire } from '@stackpress/inquire';
import { PostgresAdapter } from '@stackpress/inquire-pg';

const db = createInquire({
  adapter: new PostgresAdapter({
    host: 'localhost',
    port: 26257, // CockroachDB default port
    database: 'myapp',
    user: 'root',
    ssl: {
      rejectUnauthorized: false // Adjust based on your setup
    }
  })
});
```

## CockroachDB-Specific Features

### Serializable Transactions

```typescript
await db.transaction({
  isolationLevel: 'serializable'
}, async (trx) => {
  const user = await trx
    .insertInto('users')
    .values({ name: 'John' })
    .returning('*')
    .execute();

  await trx
    .insertInto('profiles')
    .values({ user_id: user.id })
    .execute();
});
```

### UUID Primary Keys

```typescript
// Using UUID for distributed primary keys
await db.schema.createTable('users', table => {
  table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
  table.string('name').notNull();
  table.timestamp('created_at').defaultTo(db.fn.now());
});
```

### JSON Operations

```typescript
const users = await db
  .select(['id', 'data->name as name'])
  .from('users')
  .where('data->age', '>', 25)
  .execute();
```

## Best Practices

1. **Distributed ID Generation**: Use UUID for primary keys
2. **Transaction Retry Logic**: Implement retry logic for conflicts
3. **Indexes**: Design indexes for distributed performance
4. **Batch Operations**: Use batch operations for better performance
5. **Connection Management**: Use connection pooling

## Transaction Handling

### Automatic Retries

```typescript
async function withRetry<T>(
  callback: (trx: DatabaseAdapter) => Promise<T>
): Promise<T> {
  const maxRetries = 3;
  let attempt = 0;

  while (true) {
    try {
      return await db.transaction(callback);
    } catch (error) {
      if (
        attempt++ >= maxRetries ||
        !error.code.includes('40001') // Retry only on serialization failures
      ) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 100));
    }
  }
}

// Usage
await withRetry(async (trx) => {
  // Your transaction code
});
```

## Performance Optimization

### Index Design

```typescript
// Create indexes for distributed performance
await db.schema.alterTable('users', table => {
  // Interleaved index for related data
  table.index(['tenant_id', 'created_at']);
  
  // Covering index for common queries
  table.index(['email', 'status', 'id']);
});
```

### Batch Operations

```typescript
// Efficient batch inserts
await db
  .insertInto('users')
  .values([
    { name: 'User 1', email: 'user1@example.com' },
    { name: 'User 2', email: 'user2@example.com' },
    // ... more users
  ])
  .execute();
```

## Common Issues and Solutions

### Connection Management

```typescript
const db = createInquire({
  adapter: new PostgresAdapter({
    // ... connection options
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 5000
    }
  })
});
```

### Error Handling

```typescript
try {
  await db.transaction(async (trx) => {
    // ... transaction code
  });
} catch (error) {
  if (error.code === '40001') {
    // Handle serialization failure
    console.log('Transaction conflict, retrying...');
  } else if (error.code === '23505') {
    // Handle unique constraint violation
    console.log('Duplicate key violation');
  } else {
    throw error;
  }
}
```
