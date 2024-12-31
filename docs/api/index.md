# API Reference

## Core API

### createInquire()

Creates a new Inquire instance with the specified database adapter.

```typescript
function createInquire(config: InquireConfig): Inquire;

interface InquireConfig {
  adapter: DatabaseAdapter;
  debug?: boolean;
}
```

### Query Building

#### select()

```typescript
select<T>(columns?: string[]): SelectQuery<T>
```

Creates a new SELECT query.

#### insertInto()

```typescript
insertInto(table: string): InsertQuery
```

Creates a new INSERT query.

#### update()

```typescript
update(table: string): UpdateQuery
```

Creates a new UPDATE query.

#### deleteFrom()

```typescript
deleteFrom(table: string): DeleteQuery
```

Creates a new DELETE query.

### Query Methods

#### where()

```typescript
where(column: string, operator: string, value: any): Query
where(conditions: Record<string, any>): Query
```

Adds WHERE conditions to the query.

#### orderBy()

```typescript
orderBy(column: string, direction?: 'asc' | 'desc'): Query
```

Adds ORDER BY clause to the query.

#### limit()

```typescript
limit(count: number): Query
```

Adds LIMIT clause to the query.

#### offset()

```typescript
offset(count: number): Query
```

Adds OFFSET clause to the query.

#### join()

```typescript
join(table: string, first: string, operator: string, second: string): Query
leftJoin(table: string, first: string, operator: string, second: string): Query
rightJoin(table: string, first: string, operator: string, second: string): Query
```

Adds JOIN clauses to the query.

## Type System

### Table Types

```typescript
interface TableDefinition<T> {
  name: string;
  columns: Record<keyof T, ColumnDefinition>;
}

interface ColumnDefinition {
  type: string;
  nullable?: boolean;
  default?: any;
}
```

### Query Types

```typescript
type WhereOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'like' | 'in' | 'not in';

interface QueryBuilder<T> {
  where(column: keyof T, operator: WhereOperator, value: any): QueryBuilder<T>;
  orderBy(column: keyof T, direction?: 'asc' | 'desc'): QueryBuilder<T>;
  // ... other methods
}
```
