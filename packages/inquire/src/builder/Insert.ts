//common
import type { Value, Reject, Resolve, Dialect } from '../types.js';
import Engine from '../Engine.js';
import Exception from '../Exception.js';

export default class Insert<R = unknown> {
  /**
   * Database engine
   */
  protected _engine?: Engine;
  
  /**
   * Whether to return what was inserted
   */
  protected _returning: string[] = [];
  
  /**
   * The table to delete from.
   */
  protected _table: string;

  /**
   * The values to insert.
   */
  protected _values: Record<string, Value>[] = [];

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
      returning: this._returning,
      values: this._values
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
    return dialect.insert(this);
  }

  /**
   * Whether to return what was inserted
   */
  public returning(columns: string|string[] = '*') {
    if (Array.isArray(columns)) {
      this._returning = columns;
    } else {
      this._returning = [ columns ];
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

  public values(values: Record<string, Value>|Record<string, Value>[]) {
    if (!Array.isArray(values)) {
      values = [values];
    }

    this._values = values as Record<string, any>[];
    return this;
  }
}