//common
import type { Reject, Resolve, Dialect, FlatValue } from '../types.js';
import Engine from '../Engine.js';
import Exception from '../Exception.js';

export default class Delete<R = unknown> {
  /**
   * Database engine
   */
  protected _engine?: Engine;

  /**
   * The filters to apply.
   */
  protected _filters: [string, FlatValue[]][] = [];

  /**
   * The table to delete from.
   */
  protected _table: string;

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
   * Set table, quote and action
   */
  public constructor(table: string, engine?: Engine) {
    this._table = table;
    this._engine = engine;
  }

  /**
   * Converts the class data to object
   */
  public build() {
    return {
      table: this._table,
      filters: this._filters
    }
  }

  /**
   * Convert the builder to a query object.
   */
  public query(dialect?: Dialect) {
    dialect = dialect || this._engine?.dialect;
    if (!dialect) {
      throw Exception.for('No dialect provided');
    }
    return dialect.delete(this);
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