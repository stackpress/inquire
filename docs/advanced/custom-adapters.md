# Custom Database Adapters

## Overview

While Inquire provides adapters for popular databases, you can create custom adapters for other databases or specific needs.

## Creating a Custom Adapter

```typescript
import { DatabaseAdapter, QueryResult } from '@stackpress/inquire';

class CustomDatabaseAdapter implements DatabaseAdapter {
  constructor(config: CustomConfig) {
    // Initialize your database connection
  }

  async execute<T>(query: string, params: any[]): Promise<QueryResult<T>> {
    // Implement query execution
    const result = await this.connection.query(query, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields
    };
  }

  async transaction<T>(
    callback: (trx: DatabaseAdapter) => Promise<T>
  ): Promise<T> {
    // Implement transaction handling
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(new CustomDatabaseAdapter({ client }));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Implement other required methods
}
```

## Required Methods

```typescript
interface DatabaseAdapter {
  execute<T>(query: string, params: any[]): Promise<QueryResult<T>>;
  transaction<T>(callback: (trx: DatabaseAdapter) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  fields?: QueryResultField[];
}

interface QueryResultField {
  name: string;
  type: string;
  // ... other field metadata
}
```

## Example Usage

```typescript
import { createInquire } from '@stackpress/inquire';
import { CustomDatabaseAdapter } from './custom-adapter';

const db = createInquire({
  adapter: new CustomDatabaseAdapter({
    // custom configuration
  })
});

// Use like any other adapter
const users = await db
  .select()
  .from('users')
  .execute();
```

## Best Practices

1. **Error Handling**: Properly handle and translate database-specific errors
2. **Connection Management**: Implement proper connection pooling
3. **Type Safety**: Maintain type information throughout the adapter
4. **Query Building**: Support all standard query operations
5. **Testing**: Thoroughly test the adapter with different queries and scenarios
