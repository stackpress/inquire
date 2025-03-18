//modules
import type { Transaction as TX } from '@electric-sql/pglite';
//stackpress
import type { 
  Dialect, 
  Connection, 
  QueryObject,
  Transaction
} from '@stackpress/inquire/types';
import Pgsql from '@stackpress/inquire/Pgsql';
import Exception from '@stackpress/inquire/Exception';
//local
import type { Connector, Resource, Results } from './types';

export default class PGLiteConnection implements Connection<Resource> {
  //sql language dialect
  public readonly dialect: Dialect = Pgsql;
  //the database connection
  protected _resource: Connector;

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
      if (!query.includes('?')) {
        throw Exception.for(
          'Query does not match the number of values.'
        );
      }
      //format the query
      query = query.replace('?', `$${i + 1}`);
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
    if (query.includes('?')) {
      throw Exception.for(
        'Query does not match the number of values.'
      );
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
    const results = await this.raw<R>(request);
    return results.rows;
  }

  /**
   * Returns queries and returns the raw results 
   * dictated by the native database connection.
   */
  public async raw<R = unknown>(request: QueryObject) {
    const formatted = this.format(request);
    const resource = await this.resource();
    return await this._query<R>(formatted, resource);
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
    try {
      await this.raw({ query: 'BEGIN' });
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
  protected async _query<R = unknown>(
    request: QueryObject, 
    resource: Resource|TX
  ) {
    const { query, values = [] } = request;
    return values.length === 0
      ? (await resource.exec(query))[0] as Results<R>
      : await resource.query(query, values) as Results<R>;
  }
}