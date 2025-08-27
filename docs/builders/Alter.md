# Alter

The Alter builder is used to modify existing table structures by adding, removing, or changing fields and constraints. It provides a fluent API for making incremental changes to database schemas.

```typescript
const alter = engine.alter('users')
  .addField('phone', { type: 'VARCHAR', length: 20 })
  .changeField('email', { type: 'VARCHAR', length: 320 })
  .addIndex('idx_phone', ['phone']);

await alter;
```

## Properties

The following properties are available when instantiating an Alter builder.

| Property | Type | Description |
|----------|------|-------------|
| `table` | `string` | The name of the table being altered |
| `engine` | `Engine` | The database engine instance |

## Methods

The following methods are available when using an Alter builder.

### Adding Fields

The following example shows how to add new fields to an existing table.

```typescript
await engine.alter('users')
  .addField('phone', { 
    type: 'VARCHAR', 
    length: 20, 
    nullable: true 
  })
  .addField('address', { 
    type: 'TEXT', 
    nullable: true 
  })
  .addField('birth_date', { 
    type: 'DATE', 
    nullable: true 
  })
  .addField('is_verified', { 
    type: 'BOOLEAN', 
    default: false 
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | The field name |
| `options` | `FieldOptions` | Field configuration options |

**Field Options**

| Option | Type | Description |
|--------|------|-------------|
| `type` | `string` | SQL data type (INTEGER, VARCHAR, TEXT, etc.) |
| `length` | `number` | Field length for VARCHAR, CHAR types |
| `precision` | `number` | Precision for DECIMAL types |
| `scale` | `number` | Scale for DECIMAL types |
| `nullable` | `boolean` | Whether field can be NULL (default: true) |
| `default` | `any` | Default value for the field |
| `autoIncrement` | `boolean` | Auto-increment for numeric fields |
| `unsigned` | `boolean` | Unsigned for numeric fields (MySQL) |
| `comment` | `string` | Field comment |

**Returns**

The Alter builder instance to allow method chaining.

### Removing Fields

The following example shows how to remove fields from an existing table.

```typescript
await engine.alter('users')
  .removeField('old_column')
  .removeField('deprecated_field')
  .removeField('unused_data');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | The field name to remove |

**Returns**

The Alter builder instance to allow method chaining.

### Changing Fields

The following example shows how to modify existing field definitions.

```typescript
await engine.alter('users')
  .changeField('email', { 
    type: 'VARCHAR', 
    length: 320, 
    nullable: false 
  })
  .changeField('name', { 
    type: 'VARCHAR', 
    length: 500 
  })
  .changeField('age', { 
    type: 'SMALLINT', 
    unsigned: true 
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | The field name to change |
| `options` | `FieldOptions` | New field configuration options |

**Returns**

The Alter builder instance to allow method chaining.

### Adding Primary Keys

The following example shows how to add primary key constraints to existing tables.

```typescript
// Add single column primary key
await engine.alter('categories')
  .addPrimaryKey('id');

// Add composite primary key
await engine.alter('user_permissions')
  .addPrimaryKey(['user_id', 'permission_id']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | Column name(s) for the primary key |

**Returns**

The Alter builder instance to allow method chaining.

### Removing Primary Keys

The following example shows how to remove primary key constraints.

```typescript
await engine.alter('users')
  .removePrimaryKey('old_id');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `column` | `string` | The primary key column to remove |

**Returns**

The Alter builder instance to allow method chaining.

### Adding Unique Keys

The following example shows how to add unique constraints to existing tables.

```typescript
await engine.alter('users')
  .addUniqueKey('unique_email', ['email'])
  .addUniqueKey('unique_username', ['username'])
  .addUniqueKey('unique_phone_country', ['phone', 'country_code']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the unique constraint |
| `columns` | `string[]` | Column names for the unique key |

**Returns**

The Alter builder instance to allow method chaining.

### Removing Unique Keys

The following example shows how to remove unique constraints.

```typescript
await engine.alter('users')
  .removeUniqueKey('old_unique_constraint')
  .removeUniqueKey('deprecated_unique');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the unique constraint to remove |

**Returns**

The Alter builder instance to allow method chaining.

### Adding Indexes

The following example shows how to add indexes to existing tables for improved query performance.

```typescript
await engine.alter('posts')
  .addIndex('idx_title', ['title'])
  .addIndex('idx_published_date', ['published', 'created_at'])
  .addIndex('idx_user_status', ['user_id', 'status'])
  .addIndex('idx_category', ['category_id']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the index |
| `columns` | `string[]` | Column names for the index |

**Returns**

The Alter builder instance to allow method chaining.

### Removing Indexes

The following example shows how to remove indexes from tables.

```typescript
await engine.alter('posts')
  .removeIndex('old_index')
  .removeIndex('unused_index')
  .removeIndex('deprecated_idx');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the index to remove |

**Returns**

The Alter builder instance to allow method chaining.

### Adding Foreign Keys

The following example shows how to add foreign key constraints to establish relationships.

```typescript
await engine.alter('posts')
  .addForeignKey('fk_user', {
    local: ['user_id'],
    foreign: { table: 'users', columns: ['id'] },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  })
  .addForeignKey('fk_category', {
    local: ['category_id'],
    foreign: { table: 'categories', columns: ['id'] },
    onUpdate: 'RESTRICT',
    onDelete: 'SET NULL'
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the foreign key constraint |
| `options` | `ForeignKeyOptions` | Foreign key configuration |

**Foreign Key Options**

| Option | Type | Description |
|--------|------|-------------|
| `local` | `string[]` | Local column names |
| `foreign` | `{ table: string, columns: string[] }` | Foreign table and columns |
| `onUpdate` | `string` | Action on update (CASCADE, RESTRICT, SET NULL, etc.) |
| `onDelete` | `string` | Action on delete (CASCADE, RESTRICT, SET NULL, etc.) |

**Returns**

The Alter builder instance to allow method chaining.

### Removing Foreign Keys

The following example shows how to remove foreign key constraints.

```typescript
await engine.alter('posts')
  .removeForeignKey('old_fk_constraint')
  .removeForeignKey('deprecated_foreign_key');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the foreign key constraint to remove |

**Returns**

The Alter builder instance to allow method chaining.

### Getting Query Information

The following example shows how to inspect the generated SQL before execution.

```typescript
const alterBuilder = engine.alter('users')
  .addField('phone', { type: 'VARCHAR', length: 20 })
  .addIndex('idx_phone', ['phone']);

const queries = alterBuilder.query();
queries.forEach(({ query, values }) => {
  console.log('SQL:', query);
  console.log('Values:', values);
});

// Then execute
await alterBuilder;
```

**Returns**

An array of objects containing SQL query strings and parameter values, as ALTER operations may generate multiple SQL statements.

## Common Alteration Patterns

### Adding New Features

```typescript
// Add user profile fields
await engine.alter('users')
  .addField('avatar', { type: 'VARCHAR', length: 500, nullable: true })
  .addField('bio', { type: 'TEXT', nullable: true })
  .addField('website', { type: 'VARCHAR', length: 255, nullable: true })
  .addField('location', { type: 'VARCHAR', length: 100, nullable: true })
  .addIndex('idx_location', ['location']);
```

### Improving Performance

```typescript
// Add indexes for better query performance
await engine.alter('orders')
  .addIndex('idx_customer_date', ['customer_id', 'created_at'])
  .addIndex('idx_status', ['status'])
  .addIndex('idx_total_amount', ['total_amount']);
```

### Data Type Migrations

```typescript
// Upgrade field types for better data handling
await engine.alter('products')
  .changeField('price', { 
    type: 'DECIMAL', 
    precision: 12, 
    scale: 4 
  })
  .changeField('description', { 
    type: 'LONGTEXT' 
  })
  .changeField('sku', { 
    type: 'VARCHAR', 
    length: 100, 
    nullable: false 
  });
```

### Adding Relationships

```typescript
// Add foreign key relationships
await engine.alter('order_items')
  .addField('product_variant_id', { type: 'INTEGER', nullable: true })
  .addForeignKey('fk_product_variant', {
    local: ['product_variant_id'],
    foreign: { table: 'product_variants', columns: ['id'] },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  })
  .addIndex('idx_product_variant', ['product_variant_id']);
```

## Database-Specific Features

### MySQL Features

```typescript
await engine.alter('users')
  .addField('data', { type: 'JSON' })
  .addField('tags', { type: 'SET', values: ['admin', 'user', 'guest'] })
  .changeField('id', { type: 'BIGINT', unsigned: true, autoIncrement: true });
```

### PostgreSQL Features

```typescript
await engine.alter('users')
  .addField('metadata', { type: 'JSONB' })
  .addField('tags', { type: 'TEXT[]' })
  .addField('coordinates', { type: 'POINT' });
```

### SQLite Features

```typescript
// Note: SQLite has limited ALTER TABLE support
await engine.alter('users')
  .addField('phone', { type: 'TEXT' })
  .addField('active', { type: 'INTEGER', default: 1 }); // Boolean as INTEGER
```

## Migration Strategies

### Safe Column Addition

```typescript
// Add columns with default values to avoid NULL issues
await engine.alter('users')
  .addField('email_verified', { 
    type: 'BOOLEAN', 
    default: false, 
    nullable: false 
  })
  .addField('created_at', { 
    type: 'TIMESTAMP', 
    default: 'CURRENT_TIMESTAMP', 
    nullable: false 
  });
```

### Gradual Schema Changes

```typescript
// Step 1: Add new column
await engine.alter('users')
  .addField('new_email', { type: 'VARCHAR', length: 320, nullable: true });

// Step 2: Migrate data (separate operation)
// await engine.update('users').set({ new_email: engine.raw('email') });

// Step 3: Make new column non-nullable and add constraints
await engine.alter('users')
  .changeField('new_email', { type: 'VARCHAR', length: 320, nullable: false })
  .addUniqueKey('unique_new_email', ['new_email']);

// Step 4: Remove old column
await engine.alter('users')
  .removeField('email');
```

## Type Safety

The Alter builder supports TypeScript generics for type-safe operations:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  created_at: Date;
};

const alterBuilder = engine.alter<User>('users')
  .addField('phone', { type: 'VARCHAR', length: 20, nullable: true })
  .changeField('email', { type: 'VARCHAR', length: 320 })
  .addIndex('idx_phone', ['phone']);

await alterBuilder;
```

## Error Handling

The Alter builder uses consistent error handling through the `InquireException`:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await engine.alter('users')
    .removeField('nonexistent_column')
    .addIndex('invalid_index', ['nonexistent_field']);
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Alter error:', error.message);
  }
}
```

## Complete Example

Here's a comprehensive example showing how to perform a complex table alteration:

```typescript
await engine.alter('blog_posts')
  // Add new fields
  .addField('excerpt', { 
    type: 'TEXT', 
    nullable: true 
  })
  .addField('featured_image', { 
    type: 'VARCHAR', 
    length: 500, 
    nullable: true 
  })
  .addField('meta_title', { 
    type: 'VARCHAR', 
    length: 60, 
    nullable: true 
  })
  .addField('meta_description', { 
    type: 'VARCHAR', 
    length: 160, 
    nullable: true 
  })
  .addField('reading_time', { 
    type: 'INTEGER', 
    unsigned: true, 
    nullable: true 
  })
  .addField('featured', { 
    type: 'BOOLEAN', 
    default: false 
  })
  // Modify existing fields
  .changeField('title', { 
    type: 'VARCHAR', 
    length: 300, 
    nullable: false 
  })
  .changeField('content', { 
    type: 'LONGTEXT', 
    nullable: false 
  })
  // Add indexes for performance
  .addIndex('idx_featured', ['featured'])
  .addIndex('idx_reading_time', ['reading_time'])
  .addIndex('idx_meta_title', ['meta_title'])
  // Add unique constraint
  .addUniqueKey('unique_meta_title', ['meta_title'])
  // Add foreign key for featured image
  .addField('featured_image_id', { 
    type: 'INTEGER', 
    unsigned: true, 
    nullable: true 
  })
  .addForeignKey('fk_featured_image', {
    local: ['featured_image_id'],
    foreign: { table: 'media', columns: ['id'] },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  })
  .addIndex('idx_featured_image', ['featured_image_id']);
```