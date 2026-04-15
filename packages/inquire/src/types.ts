//stackpress
import type { NestedObject } from '@stackpress/lib/types';
//builder
import type Alter from './builder/Alter.js';
import type Create from './builder/Create.js';
import type Delete from './builder/Delete.js';
import type Insert from './builder/Insert.js';
import type Select from './builder/Select.js';
import type Update from './builder/Update.js';

//--------------------------------------------------------------------//
// Schema Types

export type Field = {
  type: string,
  length?: number | [ number, number ],
  attribute?: string,
  default?: string|number|boolean,
  nullable?: boolean,
  unsigned?: boolean,
  autoIncrement?: boolean,
  comment?: string  
};

export type ForeignKey = {
  local: string, // local table column name ie. 'customer_id'
  foreign: string, // foreign table column name ie. 'id'
  table: string, // foreign table name ie. 'table_name'
  delete?: string, // ON DELETE CASCADE
  update?: string // ON UPDATE RESTRICT
};

//--------------------------------------------------------------------//
// Alter Types

export type AlterFields = {
  add: Record<string, Field>,
  update: Record<string, Field>,
  remove: string[]
};

export type AlterKeys = {
  add: Record<string, string[]>,
  remove: string[]
};

export type AlterUnqiues = {
  add: Record<string, string[]>,
  remove: string[]
};

export type AlterPrimaries = {
  add: string[],
  remove: string[]
};

export type AlterForeignKeys = {
  add: Record<string, ForeignKey>,
  remove: string[]
};

//--------------------------------------------------------------------//
// Select Types

export type Column = {
  name: string,
  table?: string
};

export type JoinType = 'inner'
  | 'left'
  | 'left_outer'
  | 'right'
  | 'right_outer'
  | 'full'
  | 'full_outer'
  | 'cross';

export type Join = { 
  type: string, 
  table: Table,  
  from: Column, 
  to: Column
};

export type Selector = {
  name: string,
  table?: string,
  alias?: string
};

export type Sort = {
  column: Column,
  direction: OrderType
};

export type OrderType = 'ASC'|'DESC'|'asc'|'desc';

export type Table = {
  name: string,
  alias?: string
};

export type Where = {
  clause: string,
  values: FlatValue[]
};

export type WhereJson = {
  selector: string,  
  query: string, 
  replace: string,
  values: JSONScalarValue[]
};

//--------------------------------------------------------------------//
// Builder Types

export interface WhereBuilder {
  where(query: string, values?: FlatValue[]): this;
  whereJson(
    query: string, 
    selector: [ string, string ], 
    value: JSONScalarValue | JSONScalarValue[]
  ): this;
  whereJsonContains(
    selector: string, 
    value: JSONScalarValue | JSONScalarValue[]
  ): this;
};

export type StrictValue = string|number;
export type StrictOptValue = StrictValue|null;
//for filters
export type FlatValue = StrictOptValue|boolean|Date;
export type JSONScalarValue = string|number|boolean|null;
//for setting values
export type Value = FlatValue
  | (FlatValue|NestedObject<Value>)[]
  | NestedObject<Value>;

export type Resolve<T> = (value: T) => T;
export type Reject = (error: Error) => void;

//--------------------------------------------------------------------//
// Dialect Types

export interface JsonDialect {
  selector: string;
  extract: string;
  contains: string;
  where(clause: string, replace: string): string;
};

export interface Dialect {
  name: string;
  q: string;
  separator: string;
  splitter: string;
  alter(builder: Alter): QueryObject[];
  create(builder: Create): QueryObject[];
  delete(builder: Delete): QueryObject;
  drop(table: string): QueryObject;
  insert(builder: Insert): QueryObject;
  json(column: string, path: string[]): JsonDialect;
  json(column: string, path?: string, separator?: string): JsonDialect;
  rename(from: string, to: string): QueryObject;
  select(builder: Select): QueryObject;
  truncate(table: string, cascade?: boolean): QueryObject;
  update(builder: Update): QueryObject;
};

//--------------------------------------------------------------------//
// Engine Types

export type OrQueryObject<V = Value> = { query: string[], values: V[] };

export type QueryObject = { query: string, values?: Value[] };

export type Transaction<R = unknown> = (tx: Connection) => Promise<R>;

export interface Connection<R = unknown> {
  //sql language dialect
  dialect: Dialect;

  //Get the last inserted id
  lastId: string | number | undefined;

  //A hook used for logging purposes. Can also manipulate the final 
  // query before execution.
  before: (request: QueryObject) => Promise<void>;

  /**
   * Formats the query to what the database connection understands
   * Formats the values to what the database connection accepts 
   */
  format(request: QueryObject): QueryObject;

  /**
   * Query the database. Should return just the expected 
   * results, because the raw results depends on the 
   * native database engine connection. Any code that uses
   * this library should not care about the kind of database.
   */
  query<R = unknown>(request: QueryObject): Promise<R[]>;

  /**
   * Returns the resource
   */
  resource(): Promise<R>;

  /**
   * Common pattern to invoke a transaction
   */
  transaction<R = unknown>(callback: Transaction<R>): Promise<R>;
};