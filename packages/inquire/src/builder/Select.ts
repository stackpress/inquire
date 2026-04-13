//common
import type { 
  Join, 
  Selector, 
  Sort, 
  OrderType, 
  Table, 
  Where,
  WhereJson,
  Reject,
  Resolve,
  Dialect, 
  FlatValue,
  JSONScalarValue,
  WhereBuilder
} from '../types.js';
import Engine from '../Engine.js';
import Exception from '../Exception.js';

export default class Select<R = unknown> implements WhereBuilder {
  /**
   * Database engine
   */
  protected _engine?: Engine;

  /**
   * The table to select from.
   */
  protected _from?: Table;

  /**
   * The JSON filters to apply.
   */
  protected _json: WhereJson[] = [];

  /**
   * The range
   */
  protected _limit: number = 0;

  /**
   * The relations to join.
   */
  protected _joins: Join[] = [];
  
  /**
   * The start
   */
  protected _offset: number = 0;

  /**
   * Notation used to indicate to traverse through JSON 
   * columns, default is colon (ex. data:info.name)
   */
  protected _selector = ':';

  /**
   * The columns to select.
   */
  protected _selectors: Selector[] = [];

  /**
   * The separator for JSON selectors, 
   * default is dot (ex. data.info.name)
   */
  protected _separator = '.';

  /**
   * The sort order.
   */
  protected _sort: Sort[] = [];

  /**
   * The filters to apply.
   */
  protected _where: Where[] = [];

  /**
   * Sets the engine for the builder
   */
  public get engine() {
    return this._engine;
  }

  /**
   * Sets the engine for the builder
   */
  public set engine(engine: Engine | undefined) {
    this._engine = engine;
  }

  /**
   * Sets the notation used to indicate to traverse through JSON 
   * columns, default is colon (ex. data:info.name)
   */
  public set selector(selector: string) {
    this._selector = selector;
  }

  /**
   * Sets the separator for JSON selectors, 
   * default is dot (ex. data.info.name)
   */
  public set separator(separator: string) {
    this._separator = separator;
  }
  
  /**
   * Set select, quote and action
   */
  public constructor(
    select: string | (string | [ string, string ])[] = '*', 
    engine?: Engine
  ) {
    this._engine = engine;
    this.select(select);
  }

  /**
   * Converts the class data to object
   */
  public build() {
    return {
      from: this._from,
      joins: this._joins,
      json: this._json,
      limit: this._limit,
      offset: this._offset,
      selectors: this._selectors,
      selector: this._selector,
      separator: this._separator,
      sort: this._sort,
      where: this._where
    }
  }

  /**
   * FROM clause
   */
  public from(table: string | string[], alias?: string) {
    if (Array.isArray(table) && table.length === 0) {
      //throw error?
      return this;
    }
    this._from = !Array.isArray(table)
      ? { name: table, alias }
      : table.length === 1
      ? { name: table[0], alias }
      : { name: table[0], alias: table[1] || alias };
    return this;
  }

  /**
   * JOIN clause
   */
  public join(
    type: string, 
    table: string | string[], 
    from: string | string[], 
    to: string | string[]
  ) {
    if ((Array.isArray(table) && table.length === 0)
      || (Array.isArray(from) && from.length === 0)
      || (Array.isArray(to) && to.length === 0)
    ) {
      //throw error?
      return this;
    }
    this._joins.push({ 
      type, 
      table: !Array.isArray(table) 
        ? { name: table }
        : table.length === 1
        ? { name: table[0] }
        : { name: table[0], alias: table[1] }, 
      from: !Array.isArray(from) 
        ? { name: from }
        : from.length === 1
        ? { name: from[0] }
        : { table: from[0], name: from[1] }, 
      to: !Array.isArray(to) 
        ? { name: to }
        : to.length === 1
        ? { name: to[0] }
        : { table: to[0], name: to[1] }
    });
    return this;
  }

  /**
   * LIMIT clause
   */
  public limit(limit: number) {
    this._limit = limit;
    return this;
  }

  /**
   * OFFSET clause
   */
  public offset(offset: number) {
    this._offset = offset;
    return this;
  }

  /**
   * ORDER BY clause
   */
  public order(
    column: string | string[], 
    direction: OrderType = 'ASC'
  ) {
    if ((Array.isArray(column) && column.length === 0)) {
      //throw error?
      return this;
    }
    this._sort.push({ 
      column: !Array.isArray(column) 
        ? { name: column }
        : column.length === 1
        ? { name: column[0] }
        : { table: column[0], name: column[1] }, 
      direction 
    });
    return this;
  }

  /**
   * Convert the builder to a query object.
   */
  public query(dialect?: Dialect) {
    dialect = dialect || this._engine?.dialect;
    if (!dialect) {
      throw Exception.for('No dialect provided');
    }
    return dialect.select(this);
  }

  /**
   * SELECT clause
   */
  public select(columns: string | (string | string[])[]) {
    //if the columns is a string
    if (typeof columns === 'string') {
      if (columns.indexOf(',') > -1) {
        this._selectors = columns
          .split(',')
          .map(column => column.trim())
          .filter(Boolean)
          .map(column => ({ name: column }));
      } else {
        this._selectors = [{ name: columns }];
      }
      return this;
    } 
    //if columns is not an array at this point
    if (!Array.isArray(columns)) {
      //then there's nothing we can do with it
      return this;
    }
    //make a storage for the final tuples
    const select: Selector[] = [];
    //for each column
    for (const column of columns) {
      //if this column is a string
      if (typeof column === 'string') {
        //make into tuple and push
        select.push({ name: column });
      //if column is an array with 2 items, we assume it's a tuple and push
      } else if (Array.isArray(column) 
        && column.every(item => typeof item === 'string')
      ) {
        column.length === 1 && select.push({ 
          name: column[0] 
        });
        column.length === 2 && select.push({ 
          name: column[0], 
          alias: column[1] 
        });
        column.length > 2 && select.push({ 
          table: column[0], 
          name: column[1], 
          alias: column[2] 
        });
      }
    }
    //if there are some valid columns
    if (select.length > 0) {
      //then set the columns
      this._selectors = select;
    }
    return this;
  }

  /**
   * Makes class awaitable. Should get the 
   * query and values and call the action.
   */
  public then(resolve: Resolve<R[]>, reject: Reject = () => {}) {
    if (!this._engine) {
      throw Exception.for('No engine provided');
    }
    return this._engine.query<R>(this.query()).then(resolve).catch(reject);
  }

  /**
   * WHERE clause
   */
  public where(clause: string, values: FlatValue[] = []) {
    this._where.push({ clause, values });
    return this;
  }

  /**
   * Special where clause for JSON columns. Checks if the value at the 
   * selector equals the provided value.
   */
  public whereJson(
    query: string, 
    selector: [ string, string ], 
    value: JSONScalarValue | JSONScalarValue[]
  ) {
    const values = Array.isArray(value) ? value : [ value ];
    this._json.push({ 
      selector: selector[0], 
      query, 
      replace: selector[1], 
      values 
    });
    return this;
  }

  /**
   * Special where clause for JSON columns. Checks if the value at the 
   * selector contains the provided value.
   */
  public whereJsonContains(
    selector: string, 
    value: JSONScalarValue | JSONScalarValue[]
  ) {
    const values = Array.isArray(value) ? value : [ value ];
    this._json.push({ 
      selector, 
      query: 'contains', 
      replace: '',
      values 
    });
    return this;
  }
};