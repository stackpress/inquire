//common
import type { 
  Value, 
  Reject,
  Resolve,
  Dialect,
  FlatValue,
  WhereBuilder,
  JSONScalarValue
} from '../types.js';
import Engine from '../Engine.js';
import Exception from '../Exception.js';

export default class Update<R = unknown> implements WhereBuilder{
  /**
   * The data to update.
   */
  protected _data: Record<string, Value> = {};

  /**
   * Database engine
   */
  protected _engine?: Engine;
  
  /**
   * The filters to apply.
   */
  protected _filters: [string, FlatValue[]][] = [];
  
  /**
   * The JSON filters to apply.
   */
  protected _json: {
    selector: string,  
    operator: string, 
    values: JSONScalarValue[]
  }[] = [];

  /**
   * The table to delete from.
   */
  protected _table: string;

  /**
   * Notation used to indicate to traverse through JSON 
   * columns, default is colon (ex. data:info.name)
   */
  protected _selector = ':';

  /**
   * The separator for JSON selectors, 
   * default is dot (ex. data.info.name)
   */
  protected _separator = '.';

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
      data: this._data,
      filters: this._filters,
      table: this._table,
      json: this._json,
      selector: this._selector,
      separator: this._separator
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
    return dialect.update(this);
  }

  /**
   * Set clause
   */
  public set(data: Record<string, Value>) {
    this._data = data;
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
  public where(query: string, values: FlatValue[] = []) {
    this._filters.push([query, values]);
    return this;
  }

  /**
   * Special where clause for JSON columns. Checks if the value at the 
   * selector equals the provided value.
   */
  public whereJsonEquals(
    selector: string, 
    value: JSONScalarValue | JSONScalarValue[]
  ) {
    const values = Array.isArray(value) ? value : [ value ];
    this._json.push({ 
      selector, 
      operator: 'equals', 
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
      operator: 'contains', 
      values 
    });
    return this;
  }
}