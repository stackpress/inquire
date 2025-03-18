//stackpress
import type { 
  Dialect, 
  Connection, 
  QueryObject,
  Transaction
} from '@stackpress/inquire/types';
import Sqlite from '@stackpress/inquire/Sqlite';
//local
import type { Connector, Resource, Results } from './types';

export default class BetterSqlite3Connection implements Connection<Resource> {
  //sql language dialect
  public readonly dialect: Dialect = Sqlite;
  //last inserted id
  protected _lastId?: number|string;
  //the database connection
  protected _resource: Connector;

  /**
   * Get the last inserted id
   */
  public get lastId() {
    return this._lastId;
  }

  /**
   * Set the connection
   */
  public constructor(resource: Connector) {
    this._resource = resource;
  }

  /**
   * Formats the query to what the database connection understands
   * Formats the values to what the database connection accepts 
   */
  public format(request: QueryObject) {
    let { query, values = [] } = request;
    for (let i = 0; i < values.length; i++) {
      //check the value for Date and arrays and objects
      const value = values[i];
      if (value instanceof Date) {
        values[i] = value.toISOString();
      } else if (Array.isArray(value)) {
        values[i] = JSON.stringify(value);
      } else if (value && typeof value === 'object') {
        values[i] = JSON.stringify(value);
      } else if (typeof value === 'boolean') {
        values[i] = Number(value);
      }
    }
    return { query, values };
  }

  /**
   * Query the database. Should return just the expected 
   * results, because the raw results depends on the 
   * native database connection. Any code that uses this 
   * library should not care about the kind of database.
   */
  public async query<R = unknown>(request: QueryObject) {
    const results = await this.raw(request);
    if (!Array.isArray(results) && results.lastInsertRowid) {
      this._lastId = results.lastInsertRowid;
    }
    return Array.isArray(results) ? results as R[] : [];
  }

  /**
   * Runs query and returns the raw results 
   * dictated by the native database connection.
   */
  public async raw<R = unknown>(request: QueryObject) {
    const formatted = this.format(request);
    return this._query<R>(formatted);
  }

  /**
   * Returns the resource
   */
  public async resource(): Promise<Resource> {
    if (typeof this._resource === 'function') {
      this._resource = await this._resource();
    }
    return this._resource;
  }

  /**
   * Runs multiple queries in a transaction
   */
  public async transaction<R = unknown>(callback: Transaction<R>) {
    try {
      await this.raw({ query: 'BEGIN TRANSACTION' });
      const results = await callback(this);
      await this.raw({ query: 'COMMIT' });
      return results;
    } catch (e) {
      await this.raw({ query: 'ROLLBACK' });
      throw e;
    }
  }

  /**
   * Call the database. If no values are provided, use exec
   */
  protected async _query<R = unknown>(request: QueryObject) {
    const { query, values = [] } = request;
    const resource = await this.resource();
    const stmt = resource.prepare(query);
    const QUERY = query.toUpperCase();
    if (QUERY.startsWith('SELECT')
      || (QUERY.startsWith('INSERT')
        && QUERY.includes('RETURNING')
      )
    ) {
      return stmt.all(...values) as R[];
    }
    return stmt.run(...values) as Results;
  }
}