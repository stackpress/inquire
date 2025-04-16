//modules
import type { ResultSetHeader } from 'mysql2/promise';
//stackpress
import type { 
  Dialect, 
  Connection, 
  QueryObject,
  Transaction
} from '@stackpress/inquire/types';
import Mysql from '@stackpress/inquire/Mysql';
//local
import type { Connector, Resource, Results } from './types.js';

export default class Mysql2Connection implements Connection<Resource> {
  //sql language dialect
  public readonly dialect: Dialect = Mysql;
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
    if (!Array.isArray(results[0]) && results[0].insertId) {
      this._lastId = results[0].insertId;
    }
    return Array.isArray(results[0]) ? results[0] as R[] : [];
  }

  /**
   * Returns queries and returns the raw results 
   * dictated by the native database connection.
   */
  public async raw<R = unknown>(request: QueryObject) {
    const formatted = this.format(request);
    return await this._query<R>(formatted);
  }

  /**
   * Returns the resource
   */
  public async resource() {
    if (typeof this._resource === 'function') {
      this._resource = await this._resource();
    }
    return this._resource;
  }

  /**
   * Runs multiple queries in a transaction
   */
  public async transaction<R = unknown>(callback: Transaction<R>) {
    const resource = await this.resource();
    try {
      await resource.beginTransaction();
      const results = await callback(this);
      await resource.commit();
      return results;
    } catch (e) {
      await resource.rollback();
      throw e;
    }
  }

  /**
   * Call the database. If no values are provided, use exec
   */
  protected async _query<R = unknown>(request: QueryObject) {
    const { query, values = [] } = request;
    const resource = await this.resource();
    const results = await resource.execute(query, values);
    if (Array.isArray(results[0])) {
      return results as Results<R>;
    }
    return results as unknown as [ ResultSetHeader, undefined ];
  }
}

