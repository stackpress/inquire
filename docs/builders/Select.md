# Select

The Select builder provides comprehensive querying capabilities with support for joins, conditions, grouping, and ordering. It offers a fluent API for building complex SELECT queries that work across different SQL dialects.

```typescript
const users = await engine.select(['id', 'name', 'email'])
  .from('users')
  .where('active = ?', [true])
  .orderBy('created_at', 'DESC')
  .limit(10);
```

## Properties

The following properties are available when instantiating a Select builder.

| Property | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | The columns being selected |
| `engine` | `Engine` | The database engine instance |

## Methods

The following methods are available when using a Select builder.

### Selecting Columns

The following example shows how to specify which columns to select from tables.

```typescript
// Select all columns
const allUsers = await engine.select('*').from('users');

// Select specific columns
const userNames = await engine.select(['id', 'name']).from('users');

// Select with aliases
const userInfo = await engine.select([
  'id',
  'name as full_name',
  'email as email_address',
  'created_at as registration_date'
]).from('users');

// Select with expressions
const userStats = await engine.select([
  'id',
  'name',
  'UPPER(email) as email_upper',
  'YEAR(created_at) as registration_year'
]).from('users');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `columns` | `string\|string[]` | Column names, expressions, or '*' for all columns |

**Returns**

The Select builder instance to allow method chaining.

### From Clause

The following example shows how to specify the source table or tables.

```typescript
// Basic from
const users = await engine.select('*').from('users');

// From with alias
const users = await engine.select('u.*').from('users u');

// From with schema (PostgreSQL/MySQL)
const users = await engine.select('*').from('public.users');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table name, optionally with alias or schema |

**Returns**

The Select builder instance to allow method chaining.

### Where Conditions

The following example shows how to add WHERE conditions to filter results.

```typescript
// Single condition
const activeUsers = await engine.select('*')
  .from('users')
  .where('active = ?', [true]);

// Multiple conditions (AND)
const filteredUsers = await engine.select('*')
  .from('users')
  .where('active = ?', [true])
  .where('created_at > ?', [new Date('2024-01-01')])
  .where('role IN (?)', [['admin', 'user']]);

// OR conditions
const users = await engine.select('*')
  .from('users')
  .where('role = ?', ['admin'])
  .orWhere('permissions LIKE ?', ['%manage%']);

// Complex conditions with grouping
const complexQuery = await engine.select('*')
  .from('users')
  .where('active = ?', [true])
  .where('(role = ? OR permissions LIKE ?)', ['admin', '%manage%']);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `condition` | `string` | SQL condition with ? placeholders |
| `values` | `any[]` | Values to replace placeholders |

**Returns**

The Select builder instance to allow method chaining.

### Joins

The following example shows how to join tables for relational queries.

```typescript
// Inner join
const usersWithPosts = await engine.select([
    'u.id',
    'u.name',
    'p.title',
    'p.created_at as post_date'
  ])
  .from('users u')
  .innerJoin('posts p', 'u.id = p.user_id');

// Left join
const allUsersWithPosts = await engine.select([
    'u.id',
    'u.name',
    'p.title'
  ])
  .from('users u')
  .leftJoin('posts p', 'u.id = p.user_id');

// Right join
const postsWithUsers = await engine.select([
    'p.title',
    'u.name'
  ])
  .from('posts p')
  .rightJoin('users u', 'p.user_id = u.id');

// Multiple joins
const complexQuery = await engine.select([
    'u.name',
    'p.title',
    'c.content as comment',
    'cat.name as category'
  ])
  .from('users u')
  .innerJoin('posts p', 'u.id = p.user_id')
  .leftJoin('comments c', 'p.id = c.post_id')
  .innerJoin('categories cat', 'p.category_id = cat.id');

// Join with additional conditions
const recentPosts = await engine.select([
    'u.name',
    'p.title'
  ])
  .from('users u')
  .innerJoin('posts p', 'u.id = p.user_id AND p.published = ?', [true]);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table to join with optional alias |
| `condition` | `string` | Join condition |
| `values` | `any[]` | Values for join condition placeholders (optional) |

**Returns**

The Select builder instance to allow method chaining.

### Grouping

The following example shows how to group results and use aggregate functions.

```typescript
// Basic grouping
const userPostCounts = await engine.select([
    'user_id',
    'COUNT(*) as post_count'
  ])
  .from('posts')
  .groupBy('user_id');

// Multiple grouping columns
const categoryStats = await engine.select([
    'category_id',
    'YEAR(created_at) as year',
    'COUNT(*) as post_count',
    'AVG(views) as avg_views'
  ])
  .from('posts')
  .groupBy('category_id', 'YEAR(created_at)');

// Grouping with joins
const userStats = await engine.select([
    'u.id',
    'u.name',
    'COUNT(p.id) as post_count',
    'MAX(p.created_at) as latest_post',
    'MIN(p.created_at) as first_post'
  ])
  .from('users u')
  .leftJoin('posts p', 'u.id = p.user_id')
  .groupBy('u.id', 'u.name');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `...columns` | `string[]` | Column names or expressions to group by |

**Returns**

The Select builder instance to allow method chaining.

### Having Conditions

The following example shows how to filter grouped results with HAVING clauses.

```typescript
// Basic having
const activeUsers = await engine.select([
    'user_id',
    'COUNT(*) as post_count'
  ])
  .from('posts')
  .where('published = ?', [true])
  .groupBy('user_id')
  .having('COUNT(*) > ?', [5]);

// Multiple having conditions
const userStats = await engine.select([
    'user_id',
    'COUNT(*) as post_count',
    'AVG(views) as avg_views'
  ])
  .from('posts')
  .groupBy('user_id')
  .having('COUNT(*) > ?', [10])
  .having('AVG(views) > ?', [1000]);

// Having with OR conditions
const popularUsers = await engine.select([
    'user_id',
    'COUNT(*) as post_count',
    'SUM(views) as total_views'
  ])
  .from('posts')
  .groupBy('user_id')
  .having('COUNT(*) > ?', [20])
  .orHaving('SUM(views) > ?', [50000]);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `condition` | `string` | HAVING condition with ? placeholders |
| `values` | `any[]` | Values to replace placeholders |

**Returns**

The Select builder instance to allow method chaining.

### Ordering

The following example shows how to sort query results.

```typescript
// Single column ordering
const users = await engine.select('*')
  .from('users')
  .orderBy('name', 'ASC');

// Multiple column ordering
const posts = await engine.select('*')
  .from('posts')
  .orderBy('published', 'DESC')
  .orderBy('created_at', 'DESC')
  .orderBy('title', 'ASC');

// Ordering by expressions
const userStats = await engine.select([
    'id',
    'name',
    'created_at'
  ])
  .from('users')
  .orderBy('YEAR(created_at)', 'DESC')
  .orderBy('MONTH(created_at)', 'DESC');

// Random ordering
const randomUsers = await engine.select('*')
  .from('users')
  .orderBy('RAND()', 'ASC'); // MySQL
  // .orderBy('RANDOM()', 'ASC'); // PostgreSQL/SQLite
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `column` | `string` | Column name or expression to order by |
| `direction` | `'ASC'\|'DESC'` | Sort direction (default: 'ASC') |

**Returns**

The Select builder instance to allow method chaining.

### Limiting and Offset

The following example shows how to limit results and implement pagination.

```typescript
// Basic limit
const topUsers = await engine.select('*')
  .from('users')
  .orderBy('created_at', 'DESC')
  .limit(10);

// Limit with offset for pagination
const page2Users = await engine.select('*')
  .from('users')
  .orderBy('id', 'ASC')
  .limit(10)
  .offset(10);

// Pagination helper
const getPage = async (page: number, perPage: number = 20) => {
  return await engine.select('*')
    .from('users')
    .orderBy('id', 'ASC')
    .limit(perPage)
    .offset((page - 1) * perPage);
};

const firstPage = await getPage(1);
const secondPage = await getPage(2);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `count` | `number` | Maximum number of rows to return |

**Returns**

The Select builder instance to allow method chaining.

### Distinct

The following example shows how to select distinct values.

```typescript
// Distinct all columns
const uniqueUsers = await engine.select('*')
  .from('users')
  .distinct();

// Distinct specific columns
const uniqueEmails = await engine.select(['email'])
  .from('users')
  .distinct();

// Distinct with multiple columns
const uniqueCombinations = await engine.select(['role', 'department'])
  .from('users')
  .distinct();
```

**Returns**

The Select builder instance to allow method chaining.

### Subqueries

The following example shows how to use subqueries in SELECT statements.

```typescript
// Subquery in WHERE clause
const usersWithPosts = await engine.select('*')
  .from('users')
  .where('id IN (SELECT DISTINCT user_id FROM posts WHERE published = ?)', [true]);

// Subquery in SELECT clause
const usersWithPostCount = await engine.select([
    'id',
    'name',
    '(SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count'
  ])
  .from('users');

// Correlated subquery
const usersWithLatestPost = await engine.select([
    'u.id',
    'u.name',
    '(SELECT title FROM posts p WHERE p.user_id = u.id ORDER BY created_at DESC LIMIT 1) as latest_post'
  ])
  .from('users u');
```

### Getting Query Information

The following example shows how to inspect the generated SQL before execution.

```typescript
const selectBuilder = engine.select(['id', 'name'])
  .from('users')
  .where('active = ?', [true])
  .orderBy('name', 'ASC')
  .limit(10);

const { query, values } = selectBuilder.query();
console.log('SQL:', query);
console.log('Values:', values);

// Then execute
const results = await selectBuilder;
```

**Returns**

An object containing the SQL query string and parameter values.

## Advanced Query Patterns

### Window Functions (PostgreSQL/MySQL 8.0+)

```typescript
// Row numbering
const rankedUsers = await engine.select([
    'id',
    'name',
    'created_at',
    'ROW_NUMBER() OVER (ORDER BY created_at) as row_num'
  ])
  .from('users');

// Partitioned ranking
const rankedPosts = await engine.select([
    'id',
    'title',
    'user_id',
    'views',
    'RANK() OVER (PARTITION BY user_id ORDER BY views DESC) as rank_in_user_posts'
  ])
  .from('posts');

// Running totals
const runningTotals = await engine.select([
    'id',
    'amount',
    'created_at',
    'SUM(amount) OVER (ORDER BY created_at) as running_total'
  ])
  .from('orders')
  .orderBy('created_at');
```

### Common Table Expressions (PostgreSQL/MySQL 8.0+)

```typescript
// Using template strings for CTEs
const hierarchicalData = await engine.sql<{
  id: number;
  name: string;
  level: number;
}>`
  WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 0 as level
    FROM categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
  )
  SELECT id, name, level
  FROM category_tree
  ORDER BY level, name
`;
```

### Conditional Aggregation

```typescript
// Conditional counts
const userStats = await engine.select([
    'user_id',
    'COUNT(*) as total_posts',
    'COUNT(CASE WHEN published = 1 THEN 1 END) as published_posts',
    'COUNT(CASE WHEN featured = 1 THEN 1 END) as featured_posts'
  ])
  .from('posts')
  .groupBy('user_id');

// Conditional sums
const salesStats = await engine.select([
    'YEAR(created_at) as year',
    'SUM(amount) as total_sales',
    'SUM(CASE WHEN status = "completed" THEN amount ELSE 0 END) as completed_sales',
    'SUM(CASE WHEN status = "refunded" THEN amount ELSE 0 END) as refunded_sales'
  ])
  .from('orders')
  .groupBy('YEAR(created_at)');
```

## Database-Specific Features

### MySQL Features

```typescript
// MySQL-specific functions
const mysqlQuery = await engine.select([
    'id',
    'name',
    'JSON_EXTRACT(metadata, "$.role") as role',
    'MATCH(title, content) AGAINST(? IN BOOLEAN MODE) as relevance'
  ])
  .from('users')
  .where('MATCH(title, content) AGAINST(? IN BOOLEAN MODE)', ['search term']);

// MySQL date functions
const dateQuery = await engine.select([
    'id',
    'DATE_FORMAT(created_at, "%Y-%m") as month',
    'COUNT(*) as count'
  ])
  .from('posts')
  .groupBy('DATE_FORMAT(created_at, "%Y-%m")');
```

### PostgreSQL Features

```typescript
// PostgreSQL-specific functions
const pgQuery = await engine.select([
    'id',
    'name',
    'data->>\'role\' as role',
    'array_length(tags, 1) as tag_count'
  ])
  .from('users')
  .where('data ? ?', ['role']);

// PostgreSQL array operations
const arrayQuery = await engine.select([
    'id',
    'title',
    'tags',
    'array_to_string(tags, \', \') as tags_string'
  ])
  .from('posts')
  .where('? = ANY(tags)', ['javascript']);
```

### SQLite Features

```typescript
// SQLite-specific functions
const sqliteQuery = await engine.select([
    'id',
    'name',
    'substr(email, instr(email, \'@\') + 1) as domain',
    'datetime(created_at, \'localtime\') as local_time'
  ])
  .from('users');
```

## Type Safety

The Select builder supports TypeScript generics for type-safe operations:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: Date;
};

type UserWithPostCount = User & {
  post_count: number;
};

// Type-safe select
const users: User[] = await engine.select<User>('*').from('users');

// Type-safe complex query
const usersWithStats: UserWithPostCount[] = await engine.select<UserWithPostCount>([
    'u.*',
    'COUNT(p.id) as post_count'
  ])
  .from('users u')
  .leftJoin('posts p', 'u.id = p.user_id')
  .groupBy('u.id');
```

## Error Handling

The Select builder uses consistent error handling through the `InquireException`:

```typescript
import { InquireException } from '@stackpress/inquire';

try {
  await engine.select('*')
    .from('nonexistent_table')
    .where('invalid_column = ?', [1]);
} catch (error) {
  if (error instanceof InquireException) {
    console.log('Select error:', error.message);
  }
}
```

## Complete Example

Here's a comprehensive example showing a complex SELECT query with multiple features:

```typescript
type PostWithDetails = {
  id: number;
  title: string;
  excerpt: string;
  author_name: string;
  author_email: string;
  category_name: string;
  tag_count: number;
  comment_count: number;
  view_count: number;
  published_at: Date;
  is_featured: boolean;
};

const featuredPosts: PostWithDetails[] = await engine.select<PostWithDetails>([
    'p.id',
    'p.title',
    'p.excerpt',
    'u.name as author_name',
    'u.email as author_email',
    'c.name as category_name',
    'COUNT(DISTINCT pt.tag_id) as tag_count',
    'COUNT(DISTINCT cm.id) as comment_count',
    'p.views as view_count',
    'p.published_at',
    'p.featured as is_featured'
  ])
  .from('posts p')
  .innerJoin('users u', 'p.user_id = u.id')
  .innerJoin('categories c', 'p.category_id = c.id')
  .leftJoin('post_tags pt', 'p.id = pt.post_id')
  .leftJoin('comments cm', 'p.id = cm.post_id AND cm.approved = ?', [true])
  .where('p.published = ?', [true])
  .where('p.published_at <= ?', [new Date()])
  .where('u.active = ?', [true])
  .where('(p.featured = ? OR p.views > ?)', [true, 1000])
  .groupBy('p.id', 'u.name', 'u.email', 'c.name')
  .having('COUNT(DISTINCT pt.tag_id) > ?', [0])
  .orderBy('p.featured', 'DESC')
  .orderBy('p.published_at', 'DESC')
  .orderBy('p.views', 'DESC')
  .limit(20);
```