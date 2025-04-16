//common
import type { 
  Order, 
  Reject,
  Resolve,
  Dialect,
  Relation, 
  FlatValue
} from '../types.js';
import Engine from '../Engine.js';
import Exception from '../Exception.js';

export default class Select<R = unknown> {
  /**
   * The columns to select.
   */
  protected _columns: string[] = [];

  /**
   * Database engine
   */
  protected _engine?: Engine;
  
  /**
   * The start
   */
  protected _offset: number = 0;

  /**
   * The filters to apply.
   */
  protected _filters: [string, FlatValue[]][] = [];

  /**
   * The range
   */
  protected _limit: number = 0;

  /**
   * The relations to join.
   */
  protected _relations: Relation[] = [];

  /**
   * The sort order.
   */
  protected _sort: [string, Order][] = [];

  /**
   * The table to select from.
   */
  protected _table?: [string, string];

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
  public constructor(select: string|string[] = '*', engine?: Engine) {
    if (Array.isArray(select)) {
      this._columns = select;
    } else {
      this._columns = [ select ];
    }
    this._engine = engine;
  }

  /**
   * Converts the class data to object
   */
  public build() {
    return {
      columns: this._columns,
      filters: this._filters,
      limit: this._limit,
      offset: this._offset,
      relations: this._relations,
      sort: this._sort,
      table: this._table
    }
  }

  /**
   * FROM clause
   */
  public from(table: string, as?: string) {
    this._table = [table, as || table];
    return this;
  }

  /**
   * JOIN clause
   */
  public join(type: string, table: string, from: string, to: string, as?: string) {
    this._relations.push({ type, table, as: as || table, from, to });
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
  public order(column: string, direction: Order = 'ASC') {
    this._sort.push([column, direction]);
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
  public where(query: string, values: FlatValue[] = []) {
    this._filters.push([query, values]);
    return this;
  }
}