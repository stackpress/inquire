//common
import type { 
  Column,
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
  protected _from?: { table: string | Table, alias?: string };

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
   * The columns to select.
   */
  protected _selectors: (Selector|string)[] = [];

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
   * Set select, quote and action
   */
  public constructor(
    select: string | (string | Selector)[] = '*', 
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
      sort: this._sort,
      where: this._where
    }
  }

  /**
   * FROM clause
   */
  public from(table: string | Table, alias?: string) {
    this._from = { table, alias };
    return this;
  }

  /**
   * JOIN clause
   */
  public join(
    type: string, 
    table: string | Table, 
    from: string | Column, 
    to: string | Column
  ) {
    this._joins.push({ type, table, from, to });
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
    column: string | Column, 
    direction: OrderType = 'ASC'
  ) {
    this._sort.push({ column, direction });
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
  public select(columns: string | (string | Selector)[]) {
    //if the columns is a string
    if (typeof columns === 'string') {
      //if a comma separated string
      if (columns.indexOf(',') > -1) {
        //set the selectors to a list of raw strings. These should be 
        // processed as is to indicate to the dialect not to format it...
        this._selectors = columns.split(',')
          .map(column => column.trim())
          .filter(Boolean);
      } else {
        //it's just a raw string, so set the selectors as 
        // is to indicate to the dialect not to format it...
        this._selectors = [ columns.trim() ];
      }
      return this;
    } 
    this._selectors = columns;
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