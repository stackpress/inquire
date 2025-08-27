# Update

The Update builder modifies existing records in tables with support for conditions and joins. It provides a fluent API for building UPDATE queries with WHERE clauses, JOIN operations, and returning updated values.

```typescript
await engine.update('users')
  .set({ email: 'newemail@example.com', updated_at: new Date() })
  .where('id = ?', [1]);
```

## Properties

The following properties are available when instantiating an Update builder.

| Property | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table to update |
| `engine` | `Engine` | The database engine instance |

## Methods

The following methods are available when using an Update builder.

### Setting Values

The following example shows how to set field values for updates.

```typescript
// Update single field
await engine.update('users')
  .set({ last_login: new Date() })
  .where('id = ?', [userId]);

// Update multiple fields
await engine.update('products')
  .set({
    price: 899.99,
    stock_quantity: 25,
    updated_at: new Date(),
    description: 'Updated product description'
  })
  .where('id = ?', [productId]);

// Update with expressions
await engine.update('posts')
  .set({
    view_count: 'view_count + 1',
    last_viewed: new Date()
  })
  .where('id = ?', [postId]);

// Update with NULL values
await engine.update('users')
  .set({
    phone: null,
    address: null,
    updated_at: new Date()
  })
  .where('active = ?', [false]);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `values` | `object` | Object containing field names and their new values |

**Returns**

The Update builder instance to allow method chaining.

### Where Conditions

The following example shows how to add WHERE conditions to specify which records to update.

```typescript
// Update specific record
await engine.update('users')
  .set({ active: false })
  .where('id = ?', [userId]);

// Update with multiple conditions
await engine.update('posts')
  .set({ published: true, published_at: new Date() })
  .where('status = ?', ['draft'])
  .where('user_id = ?', [authorId])
  .where('created_at > ?', [new Date('2024-01-01')]);

// Update with OR conditions
await engine.update('users')
  .set({ notification_enabled: false })
  .where('last_login < ?', [new Date('2023-01-01')])
  .orWhere('active = ?', [false]);

// Update with complex conditions
await engine.update('orders')
  .set({ status: 'cancelled' })
  .where('status IN (?)', [['pending', 'processing']])
  .where('created_at < ?', [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]); // 30 days ago

// Update with LIKE conditions
await engine.update('users')
  .set({ role: 'user' })
  .where('email LIKE ?', ['%@temp.com']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `condition` | `string` | SQL condition with ? placeholders |
| `values` | `any[]` | Values to replace placeholders |

**Returns**

The Update builder instance to allow method chaining.

### Joins (MySQL/PostgreSQL)

The following example shows how to update records using JOIN operations.

```typescript
// Update with INNER JOIN
await engine.update('posts p')
  .innerJoin('users u', 'p.user_id = u.id')
  .set({ 'p.featured': true })
  .where('u.role = ?', ['premium']);

// Update with LEFT JOIN
await engine.update('orders o')
  .leftJoin('customers c', 'o.customer_id = c.id')
  .set({ 
    'o.status': 'verified',
    'o.verified_at': new Date()
  })
  .where('c.verified = ?', [true])
  .where('o.status = ?', ['pending']);

// Update with multiple joins
await engine.update('order_items oi')
  .innerJoin('orders o', 'oi.order_id = o.id')
  .innerJoin('products p', 'oi.product_id = p.id')
  .set({ 'oi.discount_applied': true })
  .where('o.customer_type = ?', ['vip'])
  .where('p.category = ?', ['electronics']);

// Update with subquery in JOIN
await engine.update('users u')
  .innerJoin('(SELECT user_id, COUNT(*) as post_count FROM posts GROUP BY user_id) pc', 'u.id = pc.user_id')
  .set({ 'u.badge': 'prolific_writer' })
  .where('pc.post_count > ?', [100]);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table to join with optional alias |
| `condition` | `string` | Join condition |
| `values` | `any[]` | Values for join condition placeholders (optional) |

**Returns**

The Update builder instance to allow method chaining.

### Returning Updated Values (PostgreSQL)

The following example shows how to return updated values.

```typescript
// Return all columns of updated records
const updatedUsers = await engine.update('users')
  .set({ active: false, deactivated_at: new Date() })
  .where('last_login < ?', [cutoffDate])
  .returning('*');

console.log(`Deactivated ${updatedUsers.length} users`);

// Return specific columns
const updatedPosts = await engine.update('posts')
  .set({ published: true, published_at: new Date() })
  .where('status = ?', ['approved'])
  .returning(['id', 'title', 'published_at']);

// Return computed values
const priceUpdates = await engine.update('products')
  .set({ price: 'price * 1.1' }) // 10% price increase
  .where('category = ?', ['electronics'])
  .returning(['id', 'name', 'price', 'price * 0.9 as discounted_price']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | Column names or expressions to return |

**Returns**

The Update builder instance to allow method chaining.

### Limiting Updates (MySQL)

The following example shows how to limit the number of updated records.

```typescript
// Update only first 10 matching records
await engine.update('users')
  .set({ processed: true })
  .where('status = ?', ['pending'])
  .orderBy('created_at', 'ASC')
  .limit(10);

// Update with ORDER BY and LIMIT
await engine.update('posts')
  .set({ featured: false })
  .where('featured = ?', [true])
  .orderBy('created_at', 'ASC')
  .limit(5); // Unfeature oldest 5 featured posts
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `count` | `number` | Maximum number of rows to update |

**Returns**

The Update builder instance to allow method chaining.

### Getting Query Information

The following example shows how to inspect the generated SQL before execution.

```typescript
const updateBuilder = engine.update('users')
  .set({ active: false })
  .where('last_login < ?', [new Date('2023-01-01')]);

const { query, values } = updateBuilder.query();
console.log('SQL:', query);
console.log('Values:', values);

// Then execute
await updateBuilder;
```

**Returns**

An object containing the SQL query string and parameter values.

## Common Update Patterns

### Conditional Updates

```typescript
// Update based on current values
await engine.update('users')
  .set({
    status: 'inactive',
    deactivated_at: new Date()
  })
  .where('last_login < ?', [new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)])
  .where('status = ?', ['active']);

// Update with CASE statements
await engine.update('products')
  .set({
    status: `CASE 
      WHEN stock_quantity = 0 THEN 'out_of_stock'
      WHEN stock_quantity < 10 THEN 'low_stock'
      ELSE 'in_stock'
    END`,
    updated_at: new Date()
  })
  .where('category = ?', ['electronics']);
```

### Bulk Updates

```typescript
// Update multiple records with same values
await engine.update('posts')
  .set({
    published: true,
    published_at: new Date(),
    updated_at: new Date()
  })
  .where('status = ?', ['approved'])
  .where('scheduled_for <= ?', [new Date()]);

// Update with calculated values
await engine.update('order_items')
  .set({
    total_price: 'quantity * unit_price',
    updated_at: new Date()
  })
  .where('total_price IS NULL');
```

### Incremental Updates

```typescript
// Increment counters
await engine.update('posts')
  .set({
    view_count: 'view_count + 1',
    last_viewed: new Date()
  })
  .where('id = ?', [postId]);

// Decrement inventory
await engine.update('products')
  .set({
    stock_quantity: 'stock_quantity - ?',
    updated_at: new Date()
  }, [quantityOrdered])
  .where('id = ?', [productId])
  .where('stock_quantity >= ?', [quantityOrdered]);

// Update with mathematical operations
await engine.update('user_stats')
  .set({
    total_points: 'total_points + ?',
    level: 'FLOOR(total_points / 1000) + 1',
    updated_at: new Date()
  }, [pointsEarned])
  .where('user_id = ?', [userId]);
```

### Status Transitions

```typescript
// State machine updates
await engine.update('orders')
  .set({
    status: 'shipped',
    shipped_at: new Date(),
    tracking_number: 'TRK123456789',
    updated_at: new Date()
  })
  .where('status = ?', ['processing'])
  .where('payment_status = ?', ['completed']);

// Workflow updates
await engine.update('documents')
  .set({
    status: 'approved',
    approved_by: userId,
    approved_at: new Date(),
    next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  })
  .where('status = ?', ['pending_approval'])
  .where('submitted_at <= ?', [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]); // 7 days ago
```

## Database-Specific Features

### MySQL Features

```typescript
// MySQL-specific functions
await engine.update('users')
  .set({
    full_name: 'CONCAT(first_name, " ", last_name)',
    updated_at: 'NOW()',
    metadata: 'JSON_SET(metadata, "$.last_update", NOW())'
  })
  .where('full_name IS NULL');

// Update with MySQL date functions
await engine.update('subscriptions')
  .set({
    expires_at: 'DATE_ADD(created_at, INTERVAL 1 YEAR)',
    status: 'active'
  })
  .where('status = ?', ['pending']);

// Update with LIMIT (MySQL)
await engine.update('queue_jobs')
  .set({
    status: 'processing',
    started_at: new Date(),
    worker_id: workerId
  })
  .where('status = ?', ['pending'])
  .orderBy('priority', 'DESC')
  .orderBy('created_at', 'ASC')
  .limit(5);
```

### PostgreSQL Features

```typescript
// PostgreSQL-specific functions
await engine.update('users')
  .set({
    full_name: 'first_name || \' \' || last_name',
    updated_at: 'NOW()',
    metadata: 'metadata || \'{"last_update": "now"}\'::jsonb'
  })
  .where('full_name IS NULL')
  .returning('*');

// Update with PostgreSQL array operations
await engine.update('posts')
  .set({
    tags: 'array_append(tags, ?)',
    updated_at: 'NOW()'
  }, ['featured'])
  .where('featured = ?', [true])
  .where('NOT ? = ANY(tags)', ['featured']);

// Update with window functions
await engine.update('employees')
  .set({
    rank: `(
      SELECT ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC)
      FROM employees e2 
      WHERE e2.id = employees.id
    )`
  })
  .where('department IS NOT NULL');
```

### SQLite Features

```typescript
// SQLite-specific considerations
await engine.update('users')
  .set({
    active: 1, // Boolean as INTEGER
    full_name: 'first_name || " " || last_name',
    updated_at: 'datetime("now")'
  })
  .where('active = ?', [0]);

// Update with SQLite date functions
await engine.update('sessions')
  .set({
    expires_at: 'datetime(created_at, "+30 days")',
    updated_at: 'datetime("now")'
  })
  .where('expires_at IS NULL');
```

## Type Safety

The Update builder supports TypeScript generics for type-safe operations:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  last_login?: Date;
  updated_at: Date;
};

type UserUpdate = Partial<Omit<User, 'id'>>; // Exclude ID from updates

// Type-safe update
const updateData: UserUpdate = {
  active: false,
  updated_at: new Date()
};

const updatedUsers: User[] = await engine.update<User>('users')
  .set(updateData)
  .where('last_login < ?', [cutoffDate])
  .returning('*');

// Type-safe with specific fields
const emailUpdate: Pick<User, 'email' | 'updated_at'> = {
  email: 'newemail@example.com',
  updated_at: new Date()
};

await engine.update<User>('users')
  .set(emailUpdate)
  .where('id = ?', [userId]);
```

## Error Handling

The Update builder uses consistent error handling through the `InquireException`:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await engine.update('users')
    .set({ email: 'invalid-email' })
    .where('id = ?', [userId]);
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Update error:', error.message);
    
    // Handle specific error types
    if (error.message.includes('constraint')) {
      console.log('Constraint violation during update');
    } else if (error.message.includes('duplicate')) {
      console.log('Duplicate value during update');
    }
  }
}
```

## Performance Considerations

### Index Usage

```typescript
// Ensure WHERE conditions use indexed columns
await engine.update('users')
  .set({ last_seen: new Date() })
  .where('id = ?', [userId]); // ID is typically indexed

// Use compound indexes effectively
await engine.update('posts')
  .set({ featured: true })
  .where('user_id = ?', [authorId])
  .where('status = ?', ['published']); // If there's an index on (user_id, status)
```

### Batch Updates

```typescript
// Update in batches for large datasets
const updateInBatches = async (userIds: number[], batchSize = 1000) => {
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    await engine.update('users')
      .set({ processed: true, updated_at: new Date() })
      .where('id IN (?)', [batch]);
  }
};

await updateInBatches(largeUserIdArray);
```

### Transaction Usage

```typescript
// Use transactions for related updates
await engine.transaction(async (trx) => {
  // Update order status
  await trx.update('orders')
    .set({ 
      status: 'completed',
      completed_at: new Date()
    })
    .where('id = ?', [orderId]);
  
  // Update inventory
  await trx.update('products')
    .set({ stock_quantity: 'stock_quantity - ?' }, [quantity])
    .where('id = ?', [productId]);
  
  // Update user points
  await trx.update('users')
    .set({ points: 'points + ?' }, [earnedPoints])
    .where('id = ?', [userId]);
});
```

## Complete Example

Here's a comprehensive example showing various update patterns:

```typescript
type Order = {
  id: number;
  customer_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address: string;
  tracking_number?: string;
  shipped_at?: Date;
  delivered_at?: Date;
  updated_at: Date;
};

// Complex order processing update
const processOrders = async () => {
  return await engine.transaction(async (trx) => {
    // Update orders to processing status
    const processingOrders = await trx.update<Order>('orders')
      .set({
        status: 'processing',
        updated_at: new Date()
      })
      .where('status = ?', ['pending'])
      .where('payment_status = ?', ['completed'])
      .where('created_at <= ?', [new Date(Date.now() - 60 * 60 * 1000)]) // 1 hour ago
      .returning(['id', 'customer_id', 'total_amount']);
    
    // Update customer statistics
    if (processingOrders.length > 0) {
      const customerIds = [...new Set(processingOrders.map(o => o.customer_id))];
      
      await trx.update('customers')
        .set({
          total_orders: 'total_orders + 1',
          total_spent: `total_spent + (
            SELECT SUM(total_amount) 
            FROM orders 
            WHERE customer_id = customers.id 
            AND status = 'processing'
            AND updated_at >= ?
          )`,
          last_order_date: new Date(),
          updated_at: new Date()
        }, [new Date(Date.now() - 60 * 60 * 1000)])
        .where('id IN (?)', [customerIds]);
    }
    
    // Update inventory for processing orders
    await trx.update('products p')
      .innerJoin('order_items oi', 'p.id = oi.product_id')
      .innerJoin('orders o', 'oi.order_id = o.id')
      .set({
        'p.reserved_quantity': 'p.reserved_quantity + oi.quantity',
        'p.available_quantity': 'p.available_quantity - oi.quantity',
        'p.updated_at': new Date()
      })
      .where('o.status = ?', ['processing'])
      .where('o.updated_at >= ?', [new Date(Date.now() - 60 * 60 * 1000)]);
    
    // Log the processing
    await trx.insert('order_status_log')
      .values(processingOrders.map(order => ({
        order_id: order.id,
        old_status: 'pending',
        new_status: 'processing',
        changed_by: 'system',
        changed_at: new Date(),
        notes: 'Automatically processed after payment confirmation'
      })));
    
    return {
      processedCount: processingOrders.length,
      orderIds: processingOrders.map(o => o.id)
    };
  });
};

// Usage
const result = await processOrders();
console.log(`Processed ${result.processedCount} orders`);
```