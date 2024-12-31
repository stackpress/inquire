# SQLite Adapter

## Installation

```bash
npm install @stackpress/inquire @stackpress/inquire-sqlite3
```

## Basic Configuration

```typescript
import { createInquire } from '@stackpress/inquire';
import { SQLite3Adapter } from '@stackpress/inquire-sqlite3';

const db = createInquire({
  adapter: new SQLite3Adapter({
    filename: ':memory:', // In-memory database
    // or
    filename: './myapp.db' // File-based database
  })
});
```

## Advanced Configuration

```typescript
const db = createInquire({
  adapter: new SQLite3Adapter({
    filename: './myapp.db',
    mode: SQLite3Mode.OPEN_READWRITE | SQLite3Mode.OPEN_CREATE,
    busyTimeout: 5000,
    journal: 'WAL', // Write-Ahead Logging
    synchronous: 'NORMAL'
  })
});
```

## SQLite-Specific Features

### JSON Operations

```typescript
const users = await db
  .select(['id', "json_extract(data, '$.name') as name"])
  .from('users')
  .where("json_extract(data, '$.age')", '>', 25)
  .execute();
```

### Full-Text Search

```typescript
// Enable FTS5
await db.raw(`
  CREATE VIRTUAL TABLE posts_fts USING fts5(
    title, content,
    content='posts',
    content_rowid='id'
  )
`);

// Search
const results = await db
  .select()
  .from('posts_fts')
  .where('posts_fts', 'MATCH', 'typescript database')
  .execute();
```

### Window Functions

```typescript
const rankedUsers = await db
  .select([
    'name',
    'score',
    db.raw('row_number() OVER (ORDER BY score DESC) as rank')
  ])
  .from('users')
  .execute();
```

## Best Practices

1. **Write-Ahead Logging**: Use WAL for better concurrency
2. **Indexes**: Create appropriate indexes for performance
3. **Transactions**: Use transactions for multiple operations
4. **Busy Timeout**: Set appropriate busy timeout values
5. **Regular Maintenance**: Run VACUUM periodically

## Performance Optimization

### Memory Settings

```typescript
const db = createInquire({
  adapter: new SQLite3Adapter({
    filename: './myapp.db',
    // Performance settings
    cache: 'shared',
    pageSize: 4096,
    cacheSize: -2000 // 2MB cache
  })
});
```

### Pragmas

```typescript
// Set recommended pragmas
await db.raw(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA temp_store = MEMORY;
  PRAGMA mmap_size = 30000000000;
`);
```

## Common Issues and Solutions

### Concurrency

```typescript
// Handle busy timeouts
const db = createInquire({
  adapter: new SQLite3Adapter({
    filename: './myapp.db',
    busyTimeout: 10000,
    retryOnBusy: true
  })
});
```

### Database Locking

```typescript
// Using transactions properly
await db.transaction(async (trx) => {
  await trx.insertInto('users').values({ /* ... */ }).execute();
  await trx.insertInto('profiles').values({ /* ... */ }).execute();
});
```

### Backup and Recovery

```typescript
// Backup database
await db.raw(`
  VACUUM INTO '${backupPath}';
`);
```
