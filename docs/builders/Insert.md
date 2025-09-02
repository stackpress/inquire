# Insert

The Insert builder handles inserting single or multiple records into tables. It provides a fluent API for building INSERT queries with support for bulk inserts, returning values, and conflict resolution.

```typescript
// Single record
await engine.insert('users')
  .values({ name: 'John Doe', email: 'john@example.com' });

// Multiple records
await engine.insert('users')
  .values([
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ]);
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Bulk Insert Patterns](#3-bulk-insert-patterns)
 4. [Database-Specific Features](#4-database-specific-features)
 5. [Type Safety](#5-type-safety)
 6. [Error Handling](#6-error-handling)
 7. [Performance Considerations](#7-performance-considerations)
 8. [Complete Example](#8-complete-example)

## 1. Properties

The following properties are available when instantiating an Insert builder.

| Property | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table to insert into |
| `engine` | `Engine` | The database engine instance |

## 2. Methods

The following methods are available when using an Insert builder.

### 2.1. Inserting Values

The following example shows how to insert data into tables.

```typescript
 // Single record with all fields
 await engine.insert('products')
   .values({
     name: 'Laptop',
     description: 'High-performance laptop',
     price: 999.99,
     stock_quantity: 50,
     active: true,
     created_at: new Date()
   });

 // Single record with partial fields
 await engine.insert('users')
   .values({
     name: 'Jane Doe',
     email: 'jane@example.com'
     // Other fields will use default values or NULL
   });

 // Multiple records
 await engine.insert('categories')
   .values([
     { name: 'Electronics', slug: 'electronics', active: true },
     { name: 'Books', slug: 'books', active: true },
     { name: 'Clothing', slug: 'clothing', active: false }
   ]);

 // Insert with expressions
 await engine.insert('logs')
   .values({
     message: 'User login',
     level: 'info',
     created_at: new Date(),
     data: JSON.stringify({ userId: 123, ip: '192.168.1.1' })
   });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `data` | `object\|object[]` | Single record object or array of record objects |

**Returns**

The Insert builder instance to allow method chaining.

### 2.2. Returning Values (PostgreSQL/SQLite)

The following example shows how to return inserted values.

```typescript
 // Return all columns of inserted record
 const newUser = await engine.insert('users')
   .values({ name: 'Jane Doe', email: 'jane@example.com' })
   .returning('*');

 console.log(newUser[0]); // { id: 1, name: 'Jane Doe', email: 'jane@example.com', ... }

 // Return specific columns
 const userIds = await engine.insert('users')
   .values([
     { name: 'User 1', email: 'user1@example.com' },
     { name: 'User 2', email: 'user2@example.com' }
   ])
   .returning(['id', 'name']);

 console.log(userIds); // [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }]

 // Return computed values
 const insertResult = await engine.insert('orders')
   .values({
     customer_id: 123,
     total_amount: 99.99,
     status: 'pending'
   })
   .returning(['id', 'created_at', 'total_amount * 1.1 as total_with_tax']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | Column names or expressions to return |

**Returns**

The Insert builder instance to allow method chaining.

### 2.3. On Conflict Resolution (PostgreSQL)

The following example shows how to handle conflicts during insertion.

```typescript
 // Insert or ignore on conflict
 await engine.insert('users')
   .values({ name: 'John', email: 'john@example.com' })
   .onConflict('email')
   .doNothing();

 // Insert or update on conflict
 await engine.insert('users')
   .values({ 
     name: 'John Smith', 
     email: 'john@example.com',
     updated_at: new Date()
   })
   .onConflict('email')
   .doUpdate({ 
     name: 'John Smith',
     updated_at: new Date()
   });

 // Conflict on multiple columns
 await engine.insert('user_permissions')
   .values({ user_id: 1, permission_id: 2, granted_by: 'admin' })
   .onConflict(['user_id', 'permission_id'])
   .doUpdate({ granted_by: 'admin', updated_at: new Date() });

 // Conditional update on conflict
 await engine.insert('products')
   .values({ 
     sku: 'LAPTOP001', 
     name: 'Gaming Laptop',
     price: 1299.99,
     stock: 10
   })
   .onConflict('sku')
   .doUpdate({ 
     name: 'Gaming Laptop',
     price: 1299.99,
     stock: 'products.stock + EXCLUDED.stock' // PostgreSQL syntax
   });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | Column names that define the conflict |

**Returns**

The Insert builder instance to allow method chaining.

### 2.4. On Duplicate Key Update (MySQL)

The following example shows how to handle duplicate key conflicts in MySQL.

```typescript
 // Insert or update on duplicate key
 await engine.insert('users')
   .values({
     email: 'john@example.com',
     name: 'John Smith',
     login_count: 1,
     last_login: new Date()
   })
   .onDuplicateKeyUpdate({
     name: 'John Smith',
     login_count: 'login_count + 1',
     last_login: new Date()
   });

 // Multiple records with duplicate key handling
 await engine.insert('page_views')
   .values([
     { page_id: 1, user_id: 123, views: 1 },
     { page_id: 2, user_id: 123, views: 1 },
     { page_id: 1, user_id: 456, views: 1 }
   ])
   .onDuplicateKeyUpdate({
     views: 'views + VALUES(views)',
     updated_at: new Date()
   });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `updates` | `object` | Fields to update on duplicate key |

**Returns**

The Insert builder instance to allow method chaining.

### 2.5. Insert Ignore (MySQL)

The following example shows how to ignore duplicate key errors in MySQL.

```typescript
 // Insert and ignore duplicates
 await engine.insert('users')
   .ignore()
   .values([
     { email: 'user1@example.com', name: 'User 1' },
     { email: 'user2@example.com', name: 'User 2' },
     { email: 'user1@example.com', name: 'Duplicate User' } // Will be ignored
   ]);

 // Insert ignore with single record
 await engine.insert('categories')
   .ignore()
   .values({ name: 'Electronics', slug: 'electronics' });
```

**Returns**

The Insert builder instance to allow method chaining.

### 2.6. Getting Query Information

The following example shows how to inspect the generated SQL before execution.

```typescript
const insertBuilder = engine.insert('users')
  .values({ name: 'John Doe', email: 'john@example.com' });

const { query, values } = insertBuilder.query();
console.log('SQL:', query);
console.log('Values:', values);

// Then execute
await insertBuilder;
```

**Returns**

An object containing the SQL query string and parameter values.

## 3. Bulk Insert Patterns

Advanced patterns for inserting large datasets and handling complex insertion scenarios.

### 3.1. Large Dataset Insertion

```typescript
 // Insert large datasets in batches
 const batchSize = 1000;
 const users = []; // Assume this is a large array

 for (let i = 0; i < users.length; i += batchSize) {
   const batch = users.slice(i, i + batchSize);
   await engine.insert('users').values(batch);
 }

 // Or using a helper function
 const insertInBatches = async (data: any[], batchSize = 1000) => {
   for (let i = 0; i < data.length; i += batchSize) {
     const batch = data.slice(i, i + batchSize);
     await engine.insert('users').values(batch);
   }
 };

 await insertInBatches(users, 500);
```

### 3.2. Data Transformation During Insert

```typescript
 // Transform data before insertion
 const rawData = [
   { firstName: 'John', lastName: 'Doe', birthYear: 1990 },
   { firstName: 'Jane', lastName: 'Smith', birthYear: 1985 }
 ];

 const transformedData = rawData.map(item => ({
   name: `${item.firstName} ${item.lastName}`,
   age: new Date().getFullYear() - item.birthYear,
   created_at: new Date()
 }));

 await engine.insert('users').values(transformedData);
```

### 3.3. Conditional Insertion

```typescript
 // Insert only if certain conditions are met
 const userData = { name: 'John Doe', email: 'john@example.com' };

 // Check if user exists first
 const existingUser = await engine.select('id')
   .from('users')
   .where('email = ?', [userData.email])
   .limit(1);

 if (existingUser.length === 0) {
   await engine.insert('users').values(userData);
 }

 // Or use INSERT ... WHERE NOT EXISTS pattern
 await engine.sql`
   INSERT INTO users (name, email)
   SELECT ${userData.name}, ${userData.email}
   WHERE NOT EXISTS (
     SELECT 1 FROM users WHERE email = ${userData.email}
   )
 `;
```

## 4. Database-Specific Features

Database-specific features and optimizations for INSERT operations across different SQL dialects.

### 4.1. MySQL Features

```typescript
 // MySQL-specific data types
 await engine.insert('products')
   .values({
     name: 'Product Name',
     metadata: JSON.stringify({ color: 'red', size: 'large' }), // JSON column
     tags: 'electronics,gadgets,tech', // SET column
     created_at: new Date()
   });

 // Insert with MySQL functions
 await engine.insert('logs')
   .values({
     message: 'System startup',
     level: 'info',
     created_at: new Date(),
     server_time: 'NOW()' // MySQL function
   });

 // Get last insert ID (MySQL)
 await engine.insert('users')
   .values({ name: 'John', email: 'john@example.com' });

 console.log('Last inserted ID:', engine.connection.lastId);
```

### 4.2. PostgreSQL Features

```typescript
 // PostgreSQL-specific data types
 await engine.insert('users')
   .values({
     name: 'John Doe',
     metadata: { role: 'admin', permissions: ['read', 'write'] }, // JSONB
     tags: ['developer', 'admin'], // Array
     coordinates: '(40.7128, -74.0060)' // Point
   });

 // Insert with PostgreSQL functions
 await engine.insert('events')
   .values({
     name: 'User Registration',
     occurred_at: 'NOW()',
     data: { userId: 123, source: 'web' }
   })
   .returning('*');

 // Insert from SELECT (PostgreSQL)
 await engine.sql`
   INSERT INTO user_stats (user_id, post_count, last_post_date)
   SELECT 
     user_id,
     COUNT(*) as post_count,
     MAX(created_at) as last_post_date
   FROM posts
   GROUP BY user_id
 `;
```

### 4.3. SQLite Features

```typescript
 // SQLite-specific considerations
 await engine.insert('users')
   .values({
     name: 'John Doe',
     active: 1, // Boolean as INTEGER
     metadata: JSON.stringify({ role: 'user' }), // JSON as TEXT
     created_at: new Date().toISOString() // Date as TEXT
   });

 // Get last insert row ID (SQLite)
 await engine.insert('users')
   .values({ name: 'Jane', email: 'jane@example.com' });

 console.log('Last inserted row ID:', engine.connection.lastId);

 // Insert or replace (SQLite)
 await engine.sql`
   INSERT OR REPLACE INTO settings (key, value)
   VALUES (${key}, ${value})
 `;
```

## 5. Type Safety

The Insert builder supports TypeScript generics for type-safe operations:

```typescript
type User = {
  id?: number; // Optional for auto-increment
  name: string;
  email: string;
  active?: boolean;
  created_at?: Date;
};

type NewUser = Omit<User, 'id' | 'created_at'>; // Exclude auto-generated fields

 // Type-safe single insert
 const newUser: User[] = await engine.insert<User>('users')
   .values({ 
     name: 'John Doe', 
     email: 'john@example.com',
     active: true 
   })
   .returning('*');

 // Type-safe bulk insert
 const userData: NewUser[] = [
   { name: 'Alice', email: 'alice@example.com' },
   { name: 'Bob', email: 'bob@example.com' }
 ];

 const insertedUsers: User[] = await engine.insert<User>('users')
   .values(userData)
   .returning('*');

 // Type-safe with partial data
 const partialUser: Partial<NewUser> = {
   name: 'Jane Doe'
   // email will be required by TypeScript if not optional
 };
```

## 6. Error Handling

The Insert builder uses consistent error handling through the `InquireException`:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await engine.insert('users')
    .values({ 
      name: 'John',
      email: 'invalid-email' // Might violate constraints
    });
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Insert error:', error.message);
    
    // Handle specific error types
    if (error.message.includes('duplicate')) {
      console.log('Duplicate entry detected');
    } else if (error.message.includes('constraint')) {
      console.log('Constraint violation');
    }
  }
}
```

## 7. Performance Considerations

Performance optimization techniques for INSERT operations.

### 7.1. Batch Size Optimization

```typescript
// Optimal batch sizes for different databases
const getBatchSize = (dialect: string) => {
  switch (dialect) {
    case 'mysql': return 1000;
    case 'postgresql': return 1000;
    case 'sqlite': return 500;
    default: return 100;
  }
};

const batchSize = getBatchSize(engine.dialect.name);
```

### 7.2. Transaction Usage

```typescript
// Use transactions for large inserts
await engine.transaction(async (trx) => {
  // Insert users
  const users = await trx.insert('users')
    .values(userData)
    .returning(['id', 'name']);
  
  // Insert related data
  const profileData = users.map(user => ({
    user_id: user.id,
    bio: `Profile for ${user.name}`,
    created_at: new Date()
  }));
  
  await trx.insert('profiles').values(profileData);
  
  return users;
});
```

## 8. Complete Example

Here's a comprehensive example showing various insert patterns:

```typescript
type Product = {
  id?: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  sku: string;
  stock_quantity: number;
  active: boolean;
  metadata?: object;
  created_at?: Date;
  updated_at?: Date;
};

// Complex insert with conflict resolution
const insertProducts = async (products: Omit<Product, 'id' | 'created_at' | 'updated_at'>[]) => {
  return await engine.transaction(async (trx) => {
    // Insert products with conflict resolution
    const insertedProducts = await trx.insert<Product>('products')
      .values(products.map(product => ({
        ...product,
        created_at: new Date(),
        updated_at: new Date()
      })))
      .onConflict('sku')
      .doUpdate({
        name: 'EXCLUDED.name',
        description: 'EXCLUDED.description',
        price: 'EXCLUDED.price',
        stock_quantity: 'products.stock_quantity + EXCLUDED.stock_quantity',
        updated_at: new Date()
      })
      .returning('*');
    
    // Insert inventory records
    const inventoryData = insertedProducts.map(product => ({
      product_id: product.id!,
      quantity: product.stock_quantity,
      location: 'main-warehouse',
      created_at: new Date()
    }));
    
    await trx.insert('inventory').values(inventoryData);
    
    // Log the insertion
    await trx.insert('audit_log')
      .values({
        action: 'bulk_product_insert',
        details: JSON.stringify({ 
          count: insertedProducts.length,
          skus: insertedProducts.map(p => p.sku)
        }),
        created_at: new Date()
      });
    
    return insertedProducts;
  });
};

 // Usage
 const newProducts = [
   {
     name: 'Gaming Laptop',
     description: 'High-performance gaming laptop',
     price: 1299.99,
     category_id: 1,
     sku: 'LAPTOP-001',
     stock_quantity: 10,
     active: true,
     metadata: { brand: 'TechCorp', warranty: '2 years' }
   },
   {
     name: 'Wireless Mouse',
     description: 'Ergonomic wireless mouse',
     price: 29.99,
     category_id: 2,
     sku: 'MOUSE-001',
     stock_quantity: 50,
     active: true,
     metadata: { brand: 'TechCorp', color: 'black' }
   }
 ];

 const result = await insertProducts(newProducts);
 console.log(`Inserted ${result.length} products`);
```
