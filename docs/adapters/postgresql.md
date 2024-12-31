# PostgreSQL Adapter

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
    port: 5432,
    database: 'myapp',
    user: 'postgres',
    password: 'password',
    ssl: false
  })
});
```

## Connection Pool Options

```typescript
const db = createInquire({
  adapter: new PostgresAdapter({
    // Basic connection
    host: 'localhost',
    database: 'myapp',
    
    // Pool configuration
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  })
});
```

## SSL Configuration

```typescript
const db = createInquire({
  adapter: new PostgresAdapter({
    // ... other options
    ssl: {
      rejectUnauthorized: false,
      ca: fs.readFileSync('/path/to/server-certificates/root.crt').toString(),
      key: fs.readFileSync('/path/to/client-key/postgresql.key').toString(),
      cert: fs.readFileSync('/path/to/client-certificates/postgresql.crt').toString()
    }
  })
});
```

## PostgreSQL-Specific Features

### JSON Operations

```typescript
const users = await db
  .select(['id', 'data->name as name'])
  .from('users')
  .where('data->age', '>', 25)
  .execute();
```

### Array Operations

```typescript
const posts = await db
  .select()
  .from('posts')
  .where('tags', '@>', '{typescript,database}')
  .execute();
```

### Full-Text Search

```typescript
const searchResults = await db
  .select()
  .from('posts')
  .whereRaw('to_tsvector(content) @@ to_tsquery(?)', ['typescript & database'])
  .execute();
```

## Best Practices

1. **Connection Pooling**: Use appropriate pool sizes for your application
2. **SSL**: Enable SSL in production environments
3. **Prepared Statements**: Use parameterized queries to prevent SQL injection
4. **Error Handling**: Handle PostgreSQL-specific error codes
5. **Transactions**: Use transactions for atomic operations

## Common Issues and Solutions

### Connection Issues

```typescript
// Retry configuration
const db = createInquire({
  adapter: new PostgresAdapter({
    // ... connection options
    retry: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000
    }
  })
});
```

### Performance Optimization

```typescript
// Enable query logging in development
const db = createInquire({
  adapter: new PostgresAdapter({
    // ... connection options
    debug: process.env.NODE_ENV === 'development'
  })
});
```
