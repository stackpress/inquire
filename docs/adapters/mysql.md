# MySQL Adapter

## Installation

```bash
npm install @stackpress/inquire @stackpress/inquire-mysql2
```

## Basic Configuration

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

## Connection Pool Options

```typescript
const db = createInquire({
  adapter: new MySQL2Adapter({
    // Basic connection
    host: 'localhost',
    database: 'myapp',
    
    // Pool configuration
    pool: {
      min: 2,
      max: 10,
      acquireTimeout: 30000,
      idleTimeout: 30000,
      queueLimit: 0
    }
  })
});
```

## SSL/TLS Configuration

```typescript
const db = createInquire({
  adapter: new MySQL2Adapter({
    // ... other options
    ssl: {
      ca: fs.readFileSync('/path/to/server-ca.pem'),
      key: fs.readFileSync('/path/to/client-key.pem'),
      cert: fs.readFileSync('/path/to/client-cert.pem')
    }
  })
});
```

## MySQL-Specific Features

### JSON Operations

```typescript
const users = await db
  .select(['id', "JSON_EXTRACT(data, '$.name') as name"])
  .from('users')
  .where("JSON_EXTRACT(data, '$.age')", '>', 25)
  .execute();
```

### Full-Text Search

```typescript
const searchResults = await db
  .select()
  .from('posts')
  .whereRaw('MATCH(title, content) AGAINST(? IN BOOLEAN MODE)', ['typescript database'])
  .execute();
```

### Stored Procedures

```typescript
const result = await db.raw('CALL get_user_stats(?)', [userId]);
```

## Best Practices

1. **Character Sets**: Use UTF8MB4 for proper Unicode support
2. **Connection Pooling**: Configure pool size based on workload
3. **Prepared Statements**: Use parameterized queries
4. **Transactions**: Use transactions for data consistency
5. **Error Handling**: Handle MySQL-specific error codes

## Common Issues and Solutions

### Connection Issues

```typescript
// Handling connection losses
const db = createInquire({
  adapter: new MySQL2Adapter({
    // ... connection options
    enableReconnect: true,
    maxReconnects: 3,
    reconnectDelay: 1000
  })
});
```

### Performance Optimization

```typescript
// Enable query logging in development
const db = createInquire({
  adapter: new MySQL2Adapter({
    // ... connection options
    debug: process.env.NODE_ENV === 'development',
    trace: true
  })
});
```

### Timezone Handling

```typescript
const db = createInquire({
  adapter: new MySQL2Adapter({
    // ... other options
    timezone: 'UTC',
    dateStrings: true
  })
});
```
