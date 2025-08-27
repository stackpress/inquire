//builder
import Alter from './builder/Alter.js';
import Create from './builder/Create.js';
import Delete from './builder/Delete.js';
import Insert from './builder/Insert.js';
import Select from './builder/Select.js';
import Update from './builder/Update.js';
//local
import type { 
  Value, 
  Connection, 
  QueryObject, 
  Transaction 
} from './types.js';
import { jsonCompare } from './helpers.js';

export default class Engine<R = unknown> {
  //database connection
  public readonly connection: Connection<R>;
  
  /**
   * Returns sql dialect
   */
  public get dialect() {
    return this.connection.dialect;
  }

  /**
   * Sets the query callback
   */
  public constructor(connection: Connection<R>) {
    this.connection = connection;
  }

  /**
   * Alter table query builder
   */
  public alter<R = unknown>(table: string) {
    return new Alter<R>(table, this);
  }

  /**
   * Create table query builder
   */
  public create<R = unknown>(table: string) {
    return new Create<R>(table, this);
  }

  /**
   * Delete table query builder
   */
  public delete<R = unknown>(table: string) {
    return new Delete<R>(table, this);
  }

  /**
   * Compares to create builders and generates an alter builder
   * NOTE: This does not compare table names
   */
  public diff(from: Create, to: Create) {
    const build = {
      from: from.build(),
      to: to.build()
    };
    const alter = this.alter(build.from.table);
    //remove column if not in the new table
    //find fields that exists in both tables
    //and check if they are different
    for (const name in build.from.fields) {
      if (!build.to.fields[name]) {
        alter.removeField(name);
        continue;
      }
      const from = build.from.fields[name];
      const to = build.to.fields[name];
      //check for differences
      if (from.type !== to.type
        || from.length !== to.length
        || from.nullable !== to.nullable
        || from.default !== to.default
        || from.autoIncrement !== to.autoIncrement
        || from.attribute !== to.attribute
        || from.comment !== to.comment
        || from.unsigned !== to.unsigned
      ) {
        alter.changeField(name, to)
      }
    }
    //remove primary key if not in the new table
    for (const name of build.from.primary) {
      if (!build.to.primary.includes(name)) {
        alter.removePrimaryKey(name);
      }
    }
    //remove unique key if not in the new table
    for (const name in build.from.unique) {
      if (!build.to.unique[name]) {
        alter.removeUniqueKey(name);
        continue;
      }
      //check if the unique key is different
      if (!jsonCompare(build.from.unique[name], build.to.unique[name])) {
        alter.removeUniqueKey(name);
        alter.addUniqueKey(name, build.to.unique[name]);
      }
    }
    //remove index if not in the new table
    for (const name in build.from.keys) {
      if (!build.to.keys[name]) {
        alter.removeKey(name);
        continue;
      }
      //check if the index is different
      if (!jsonCompare(build.from.keys[name], build.to.keys[name])) {
        alter.removeKey(name);
        alter.addKey(name, build.to.keys[name]);
      }
    }
    //remove foreign key if not in the new table
    for (const name in build.from.foreign) {
      if (!build.to.foreign[name]) {
        alter.removeForeignKey(name);
        continue;
      }
      //check if the foreign key is different
      if (!jsonCompare(build.from.foreign[name], build.to.foreign[name])) {
        alter.removeForeignKey(name);
        alter.addForeignKey(name, build.to.foreign[name]);
      }
    }
    //add field if not in the old table
    for (const name in build.to.fields) {
      if (!build.from.fields[name]) {
        alter.addField(name, build.to.fields[name]);
      }
    }
    //add primary key if not in the old table
    for (const name of build.to.primary) {
      if (!build.from.primary.includes(name)) {
        alter.addPrimaryKey(name);
      }
    }
    //add unique key if not in the old table
    for (const name in build.to.unique) {
      if (!build.from.unique[name]) {
        alter.addUniqueKey(name, build.to.unique[name]);
      }
    }
    //add index if not in the old table
    for (const name in build.to.keys) {
      if (!build.from.keys[name]) {
        alter.addKey(name, build.to.keys[name]);
      }
    }
    //add foreign key if not in the old table
    for (const name in build.to.foreign) {
      if (!build.from.foreign[name]) {
        alter.addForeignKey(name, build.to.foreign[name]);
      }
    }

    return alter;
  }

  /**
   * Drops a table
   */
  public drop(table: string) {
    const { query, values } = this.dialect.drop(table);
    return this.query(query, values);
  }

  /**
   * Inser table query builder
   */
  public insert<R = unknown>(table: string) {
    return new Insert<R>(table, this);
  }

  /**
   * Query the database. Should return just the expected 
   * results, because the raw results depends on the 
   * native database engine connection. Any code that uses
   * this library should not care about the kind of database.
   */
  public query<R = unknown>(query: QueryObject): Promise<R[]>;
  public query<R = unknown>(query: string, values?: Value[]): Promise<R[]>;
  public query<R = unknown>(query: string|QueryObject, values: Value[] = []) {
    if (typeof query === 'string') {
      query = { query, values };
    }
    return this.connection.query<R>(query);
  }

  /**
   * Renames a table
   */
  public rename(from: string, to: string) {
    const { query, values } = this.dialect.rename(from, to);
    return this.query(query, values);
  }

  /**
   * Select table query builder
   */
  public select<R = unknown>(columns?: string|string[]) {
    return new Select<R>(columns, this);
  }

  /**
   * Template string query builder
   * 
   * Usage:
   * await engine.sql`SELECT * FROM table WHERE id = ${id}`;
   */
  public sql<R = unknown>(
    strings: TemplateStringsArray|string[], 
    ...values: Value[]
  ) {
    const query = strings.join('?').replaceAll('`', this.dialect.q);
    return this.query<R>(query, values);
  }

  /**
   * Common pattern to invoke a transaction
   */
  public transaction<R = unknown>(callback: Transaction<R>) {
    return this.connection.transaction<R>(callback);
  }

  /**
   * Truncate table
   */
  public truncate(table: string, cascade = false) {
    const { query, values } = this.dialect.truncate(table, cascade);
    return this.query(query, values);
  }

  /**
   * Update table query builder
   */
  public update<R = unknown>(table: string) {
    return new Update<R>(table, this);
  }
}