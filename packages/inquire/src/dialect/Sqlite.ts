//builder
import type Alter from '../builder/Alter.js';
import type Create from '../builder/Create.js';
import type Delete from '../builder/Delete.js';
import type Insert from '../builder/Insert.js';
import type Select from '../builder/Select.js';
import type Update from '../builder/Update.js';
//common
import type { 
  Column,
  JoinType, 
  Value, 
  FlatValue, 
  Dialect, 
  JsonDialect,
  QueryObject,
  OrQueryObject,
  JSONScalarValue
} from '../types.js';
import Exception from '../Exception.js';
import { joinTypes, isIndex } from '../helpers.js';

//The character used to quote identifiers.
export const q = '`';

export const typemap: Record<string, string> = {
  object: 'TEXT',
  hash: 'TEXT',
  json: 'TEXT',
  char: 'CHAR',
  string: 'VARCHAR',
  varchar: 'VARCHAR',
  text: 'TEXT',
  bool: 'INTEGER',
  boolean: 'INTEGER',
  number: 'INTEGER',
  int: 'INTEGER',
  integer: 'INTEGER',
  float: 'REAL',
  date: 'INTEGER',
  datetime: 'INTEGER',
  time: 'INTEGER'
};

export class SqliteDialect implements Dialect {
  //The name of the dialect, used for logging and error messages.
  public readonly name = 'sqlite';
  //Recommended quote character
  public readonly q = q;

  //used for json notation
  public separator: string = '.';
  public splitter: string = ':';

  /**
   * Converts alter builder to query and values
   * 
   * NOTES:
   * - SQLite does not support modifying NOT NULL directly.
   * - SQLite does not support modifying DEFAULT directly.
   * - SQLite does not support modifying AUTOINCREMENT directly.
   * - SQLite does not support adding or removing a foreign key.
   * - SQLite does not support adding or removing a primary key constraint.
   * 
   * Alter Functions:
   * - ALTER TABLE table_name ADD COLUMN column_name data_type [column_constraint];
   * - ALTER TABLE table_name DROP COLUMN column_name;
   * - ALTER TABLE table_name ALTER COLUMN column_name SET DATA TYPE data_type;
   * - CREATE INDEX new_index_name ON table_name(new_column1, new_column2);
   * - CREATE UNIQUE INDEX new_index_name ON table_name(new_column1, new_column2);
   * - DROP INDEX index_name;
   */
  alter(builder: Alter) {
    const build = builder.build();
    const transactions: QueryObject[] = [];

    //----------------------------------------------------------------//
    // Remove columns
    //
    // ALTER TABLE table_name DROP COLUMN column_name;

    build.fields.remove.forEach(name => {
      transactions.push({
        query: `ALTER TABLE ${this.q}${build.table}${this.q} DROP COLUMN ${this.q}${name}${this.q}`,
        values: []
      });
    });

    //----------------------------------------------------------------//
    // Add columns
    //
    // ALTER TABLE table_name ADD COLUMN column_name data_type [column_constraint];

    Object.keys(build.fields.add).forEach(name => {
      const field = build.fields.add[name];
      const column: string[] = [];
      const { type, length } = this._getType(field.type, field.length);
      column.push(`${this.q}${name}${this.q}`);
      if (type === 'REAL' || type === 'INTEGER') {
        column.push(type);
      } else if (Array.isArray(length)) {
        column.push(`${type}(${length.join(', ')})`);
      } else if (length) {
        column.push(`${type}(${length})`);
      } else {
        column.push(type);
      }
      field.attribute && column.push(field.attribute);
      !field.nullable && column.push('NOT NULL');
      field.autoIncrement && column.push('AUTOINCREMENT');
      if (field.default) {
        if (typeof field.default === 'boolean') {
          column.push(`DEFAULT ${field.default ? '1' : '0'}`);
        } else if (!isNaN(Number(field.default))) {
          column.push(`DEFAULT ${field.default}`);
        } else if (typeof field.default === 'string' 
          && field.default.toUpperCase() === 'NOW()'
        ) {
          column.push('DEFAULT CURRENT_TIMESTAMP');
        } else if (typeof field.default === 'string' 
          && field.default.endsWith('()')
        ) {
          column.push(`DEFAULT ${field.default.toUpperCase()}`);
        } else {
          column.push(`DEFAULT '${field.default}'`);
        }
      } else if (field.nullable) {
        column.push('DEFAULT NULL');
      }

      transactions.push({
        query: `ALTER TABLE ${this.q}${build.table}${this.q} ADD COLUMN ${column.join(' ')}`,
        values: []
      });
    });

    //----------------------------------------------------------------//
    // Update columns
    //
    // ALTER TABLE table_name ALTER COLUMN column_name SET DATA TYPE data_type;

    Object.keys(build.fields.update).map(name => {
      const field = build.fields.update[name];
      let { type, length } = this._getType(field.type, field.length);
      
      if (type === 'REAL' || type === 'INTEGER') {
      } else if (Array.isArray(length)) {
        type = `${type}(${length.join(', ')})`;
      } else if (length) {
        type = `${type}(${length})`;
      }
      //SQLite does not support modifying column constraints (like NOT NULL, DEFAULT) directly.
      transactions.push({
        query: `ALTER TABLE ${this.q}${build.table}${this.q} ALTER COLUMN ${this.q}${name}${this.q} SET DATA TYPE ${type}`,
        values: []
      });
    });

    //----------------------------------------------------------------//
    // Remove unique keys
    //
    // DROP INDEX index_name;

    build.unique.remove.forEach(name => {
      transactions.push({
        query: `DROP INDEX ${this.q}${name}${this.q}`,
        values: []
      });
    });

    //----------------------------------------------------------------//
    // Add unique keys
    //
    // CREATE UNIQUE INDEX new_index_name ON table_name(new_column1, new_column2);

    Object.entries(build.unique.add).forEach(([name, values]) => {
      transactions.push({ 
        query: `CREATE UNIQUE INDEX ${this.q}${name}${this.q} ON ${this.q}${build.table}${this.q}(${this.q}${values.join(`${this.q}, ${this.q}`)}${this.q})`, 
        values: [] 
      });
    });

    //----------------------------------------------------------------//
    // Remove keys
    //
    // DROP INDEX index_name;

    build.keys.remove.forEach(name => {
      transactions.push({
        query: `DROP INDEX ${this.q}${name}${this.q}`,
        values: []
      });
    });

    //----------------------------------------------------------------//
    // Add keys
    //
    // CREATE INDEX new_index_name ON table_name(new_column1, new_column2);

    Object.entries(build.keys.add).forEach(([name, values]) => {
      transactions.push({ 
        query: `CREATE INDEX ${this.q}${name}${this.q} ON ${this.q}${build.table}${this.q}(${this.q}${values.join(`${this.q}, ${this.q}`)}${this.q})`, 
        values: [] 
      });
    });

    if (transactions.length === 0) {
      throw Exception.for('No alterations made.')
    }
    return transactions;
  }

  /**
   * Converts create builder to query and values
   */
  create(builder: Create) {
    const build = builder.build();
    if (!Object.values(build.fields).length) {
      throw Exception.for('No fields provided');
    }

    const transactions: QueryObject[] = [];

    //----------------------------------------------------------------//
    // Create table
    //
    // CREATE TABLE IF NOT EXISTS table_name (
    //   column1_name data_type [column_constraint]
    // )
    const fields = Object.keys(build.fields).map(name => {
      const field = build.fields[name];
      const column: string[] = [];
      const { type, length } = this._getType(field.type, field.length);
      column.push(`${this.q}${name}${this.q}`);
      if (type === 'REAL' || type === 'INTEGER') {
        column.push(type);
      } else if (Array.isArray(length)) {
        column.push(`${type}(${length.join(', ')})`);
      } else if (length) {
        column.push(`${type}(${length})`);
      } else {
        column.push(type);
      }
      field.attribute && column.push(field.attribute);
      !field.nullable && column.push('NOT NULL');
      if (field.default) {
        if (typeof field.default === 'boolean') {
          column.push(`DEFAULT ${field.default ? '1' : '0'}`);
        } else if (!isNaN(Number(field.default))) {
          column.push(`DEFAULT ${field.default}`);
        } else if (typeof field.default === 'string' 
          && field.default.toUpperCase() === 'NOW()'
        ) {
          column.push('DEFAULT CURRENT_TIMESTAMP');
        } else if (typeof field.default === 'string' 
          && field.default.endsWith('()')
        ) {
          column.push(`DEFAULT ${field.default.toUpperCase()}`);
        } else {
          column.push(`DEFAULT '${field.default}'`);
        }
      } else if (field.nullable) {
        column.push('DEFAULT NULL');
      }

      if (build.primary.includes(name)) {
        column.push('PRIMARY KEY');
      }
      field.autoIncrement && column.push('AUTOINCREMENT');

      return column.join(' ');
    });

    //----------------------------------------------------------------//
    // Add foreign keys
    //
    // FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    // ON DELETE CASCADE
    // ON UPDATE RESTRICT
    if (Object.keys(build.foreign).length) {
      fields.push(...Object.values(build.foreign).map(info => {
        return [
          `FOREIGN KEY (${this.q}${info.local}${this.q})`,
          `REFERENCES ${this.q}${info.table}${this.q}(${this.q}${info.foreign}${this.q})`,
          info.delete ? `ON DELETE ${info.delete}`: '', 
          info.update ? `ON UPDATE ${info.update}`: ''
        ].join(' ');
      }));
    }

    transactions.push({ 
      query: `CREATE TABLE IF NOT EXISTS ${this.q}${build.table}${this.q} (${fields.join(', ')})`, 
      values: [] 
    });

    //----------------------------------------------------------------//
    // Add unique keys
    //
    // CREATE UNIQUE INDEX new_index_name ON table_name(new_column1, new_column2);

    Object.entries(build.unique).forEach(([name, values]) => {
      transactions.push({ 
        query: `CREATE UNIQUE INDEX ${this.q}${name}${this.q} ON ${this.q}${build.table}${this.q}(${this.q}${values.join(`${this.q}, ${this.q}`)}${this.q})`, 
        values: [] 
      });
    });

    //----------------------------------------------------------------//
    // Add keys
    //
    // CREATE INDEX new_index_name ON table_name(new_column1, new_column2);

    Object.entries(build.keys).forEach(([name, values]) => {
      transactions.push({ 
        query: `CREATE INDEX ${this.q}${name}${this.q} ON ${this.q}${build.table}${this.q}(${this.q}${values.join(`${this.q}, ${this.q}`)}${this.q})`, 
        values: [] 
      });
    });

    return transactions;
  }

  /**
   * Converts delete builder to query and values
   */
  delete(builder: Delete) {
    const build = builder.build();
    if (!build.filters.length) {
      throw Exception.for('No filters provided');
    }

    const query: string[] = [];
    const values: FlatValue[] = [];
    query.push(`DELETE FROM ${this.q}${build.table}${this.q}`);

    const filters = build.filters.map(filter => {
      values.push(...filter[1]);
      return filter[0];
    }).join(' AND ');
    query.push(`WHERE ${filters}`);

    return { query: query.join(' '), values };
  }

  /**
   * Drops a table
   */
  drop(table: string) {
    return { query: `DROP TABLE IF EXISTS ${this.q}${table}${this.q}`, values: [] };
  }

  /**
   * Converts insert builder to query and values
   */
  insert(builder: Insert) {
    const build = builder.build();
    if (build.values.length === 0) {
      throw Exception.for('No values provided');
    }

    const query: string[] = [];
    const values: Value[] = [];
    
    query.push(`INSERT INTO ${this.q}${build.table}${this.q}`);

    const keys = Object.keys(build.values[0]);
    query.push(`(${this.q}${keys.join(`${this.q}, ${this.q}`)}${this.q})`);

    const row = build.values.map((value) => {
      const row = keys.map(key => value[key]);
      values.push(...row);
      return `(${row.map(() => '?').join(', ')})`;
    });

    query.push(`VALUES ${row.join(', ')}`);
    if (build.returning.length) {
      query.push(`RETURNING ${build.returning.map(
        column => column !== '*' ? `${this.q}${column}${this.q}` : column
      ).join(', ')}`);
    }
    return { query: query.join(' '), values };
  }

  /**
   * Returns a subset of methods for handling JSON selectors in queries.
   */
  public json(column: string, path: string[]): JsonDialect;
  public json(column: string, path?: string, separator?: string): JsonDialect;
  public json(column: string, path?: string|string[], separator?: string) {
    if (!Array.isArray(path)) {
      return SqliteJsonDialect.parse(
        column, 
        path || ':', 
        separator || '.', 
        this.q
      );
    }
    //split the by . and remove empty ones
    const columnPath = column.split('.').filter(Boolean);
    return new SqliteJsonDialect(
      columnPath.length === 0 
        //ex. profile_id
        ? { name: column } 
        : columnPath.length === 1 
        //ex. profile_id
        ? { name: columnPath[0] } 
        //ex. profile.profile_id
        : { table: columnPath[0], name: columnPath[1] }, 
      path,
      this.q
    );
  }

  /**
   * Renames a table
   */
  rename(from: string, to: string) {
    return { 
      query: `ALTER TABLE ${this.q}${from}${this.q} RENAME TO ${this.q}${to}${this.q}`, 
      values: [] 
    };
  }

  /**
   * Converts select builder to query and values
   */
  select(builder: Select) {
    const build = builder.build();
    if (!build.from) {
      throw Exception.for('No table specified');
    }

    const query: string[] = [];
    const values: FlatValue[] = [];

    const columns = build.selectors.map(selector => {
      const name = selector.name !== '*' 
        ? `${this.q}${selector.name}${this.q}` 
        : '*';
      return selector.table && selector.alias
        ? `${this.q}${selector.table}${this.q}.${name} AS ${this.q}${selector.alias}${this.q}`
        : selector.table
        ? `${this.q}${selector.table}${this.q}.${name}`
        : selector.alias
        ? `${name} AS ${this.q}${selector.alias}${this.q}`
        : name
    });

    query.push(`SELECT ${columns.join(', ')}`);

    const table = `${this.q}${build.from.name}${this.q}`;
    if (build.from.alias) {
      const alias = `${this.q}${build.from.alias}${this.q}`;
      query.push(`FROM ${table} AS ${alias}`);
    } else {
      query.push(`FROM ${table}`);
    }

    if (build.joins.length) {
      const joins = build.joins.map(relation => {
        const type = joinTypes[relation.type as JoinType];
        const table = relation.table.alias 
          ? `${this.q}${relation.table.name}${this.q}`
            + ` AS ${this.q}${relation.table.alias}${this.q}`
          : `${this.q}${relation.table.name}${this.q}`;
        const from = relation.from.table 
          ? `${this.q}${relation.from.table}${this.q}.${this.q}${relation.from.name}${this.q}`
          : `${this.q}${relation.from.name}${this.q}`;
        const to = relation.to.table 
          ? `${this.q}${relation.to.table}${this.q}.${this.q}${relation.to.name}${this.q}`
          : `${this.q}${relation.to.name}${this.q}`;
        return `${type} JOIN ${table} ON (${from} = ${to})`;
      });
      query.push(joins.join(' '));
    }

    if (build.where.length > 0 || build.json.length > 0) {
      const filters: string[] = [];
      if (build.where.length) {
        //find json phrases
        // - ex. data:info.name
        // - ex. profile.data:info
        // - ex. profile.data:info.name
        const jsonSelector = new RegExp(
          `([a-zA-Z0-9_]+(\\.[a-zA-Z0-9_]+){0,1}\\${this.splitter}`
          + `[a-zA-Z0-9_]+(\\${this.separator}[a-zA-Z0-9_]+)*)`, 
          'g'
        );
        filters.push(...build.where.map(filter => {
          values.push(...filter.values);
          //then replace with XJsonDialect.parse().extract
          return filter.clause.replace(jsonSelector, match => {
            const json = SqliteJsonDialect.parse(
              match,
              this.splitter,
              this.separator
            );
            return json ? json.extract : match;
          });
        }));
      }
      build.json.forEach(filter => {
        const { query, replace } = filter;
        //convert builder selector to json dialect
        const json = SqliteJsonDialect.parse(
          filter.selector, 
          this.splitter, 
          this.separator
        );
        //if invalid JSON selector, skip it
        if (!json) return;
        
        //make a temporary or query object to hold the JSON filters
        const or: OrQueryObject<JSONScalarValue> = { query: [], values: [] };
        //if the operator is contains, we need to use EXISTS pollyfill
        if (query === 'contains') {
          filter.values.forEach(value => {
            or.query.push(json.contains);
            or.values.push(value);
          });
        // JSON_EXTRACT and compare it to the value
        } else {
          const clause = json.where(query, replace);
          filter.values.forEach(value => {
            or.query.push(clause);
            or.values.push(value);
          });
        }
        //if there are any JSON filters, wrap them in 
        // parentheses and add them to the main filters
        if (or.query.length > 0 && or.values.length > 0) {
          filters.push(`(${or.query.join(' OR ')})`);
          values.push(...or.values);
        }
      });
      //if there are any filters
      if (filters.length > 0) {
        //add them to the query
        query.push(`WHERE ${filters.join(' AND ')}`);
      }
    }

    if (build.sort.length) {
      const sort = build.sort.map(sort => {
        //if the sort column is using the selector ":" notation
        if (sort.column.name.includes(this.splitter)) {
          const json = SqliteJsonDialect.parse(
            sort.column.name, 
            this.splitter, 
            this.separator
          );
          //if invalid JSON selector, skip it
          if (!json) return '';
          return `${json.extract} ${sort.direction.toUpperCase()}`;
        }
        const column = sort.column.table 
          ? `${this.q}${sort.column.table}${this.q}.${this.q}${sort.column.name}${this.q}`
          : `${this.q}${sort.column.name}${this.q}`;
        return `${column} ${sort.direction.toUpperCase()}`;
      }).filter(Boolean);
      query.push(`ORDER BY ${sort.join(`, `)}`);
    }

    if (build.limit) {
      query.push(`LIMIT ${build.limit}`);
    }

    if (build.offset) {
      query.push(`OFFSET ${build.offset}`);
    }

    return { query: query.join(' '), values };
  }

  /**
   * Truncate table
   */
  truncate(table: string, cascade = false) {
    return { 
      query: `TRUNCATE TABLE ${this.q}${table}${this.q}${cascade ? ' CASCADE' : ''}`, 
      values: [] 
    };
  }

  /**
   * Converts update builder to query and values
   */
  update(builder: Update) {
    const build = builder.build();
    if (!Object.keys(build.data).length) {
      throw Exception.for('No data provided');
    }

    const query: string[] = [];
    const values: Value[] = [];

    query.push(`UPDATE ${this.q}${build.table}${this.q}`);

    if (Object.keys(build.data).length) {
      const data = Object.keys(build.data).map(key => {
        values.push(build.data[key]);
        return `${this.q}${key}${this.q} = ?`;
      }).join(', ');
      query.push(`SET ${data}`);
    }

    if (build.filters.length) {
      const filters = build.filters.map(filter => {
        values.push(...filter[1]);
        return filter[0];
      }).join(' AND ');
      query.push(`WHERE ${filters}`);
    }

    return { query: query.join(' '), values };
  }

  /**
   * Returns a type and length for the given type key and length,
   * properly formatted for SQL.
   */
  protected _getType(key: string, length?: number | [ number, number ]) {
    //try to infer the type from the key
    let type = typemap[key.toLowerCase()] || key.toUpperCase();
    //if length is a number...
    if (!Array.isArray(length)) {
      //if char, varchar
      if (type === 'CHAR' || type === 'VARCHAR') {
        //make sure there's a length
        length = length || 255;
      }
      //if int
      if (type === 'INTEGER' || type === 'REAL') {
        length = undefined;
      }
    }
    return { type, length };
  }
};

export class SqliteJsonDialect implements JsonDialect {
  /**
   * Parses a JSON selector string into a PgsqlJsonDialect object.
   */
  public static parse(
    selector: string, 
    splitter = ':', 
    separator = '.', 
    quote = q
  ) {
    //if the selector is empty
    if (selector.length === 0) {
      //return empty column and selector
      return null;
    }
    //ex. data:info.name -> column: data, selector: info.name
    //get the first occurrence of the : in the filter selector
    const index = selector.indexOf(splitter);
    //if there's no selector notation
    if (index === -1) {
      //NOTE: dont use separator in this case, just use static '.'
      const columnPath = selector.split('.').filter(Boolean);
      //now form the column object
      const column = columnPath.length === 0 
        //ex. profile_id
        ? { name: selector } 
        : columnPath.length === 1 
        //ex. profile_id
        ? { name: columnPath[0] } 
        //ex. profile.profile_id
        : { table: columnPath[0], name: columnPath[1] };
      //the entire selector is the column
      return new SqliteJsonDialect(column, [], quote);
    }
    //get the char length of the selector notation (:)
    const length = splitter.length;
    //get the left part of the selector before the selector notation (:)
    //this is either something like: profile_id or profile.profile_id
    const select = selector.substring(0, index);
    //split the by . and remove empty ones
    //NOTE: dont use separator in this case, just use static '.'
    const columnPath = select.split('.').filter(Boolean);
    //now form the column object
    const column = columnPath.length === 0 
      //ex. profile_id
      ? { name: selector } 
      : columnPath.length === 1 
      //ex. profile_id
      ? { name: columnPath[0] } 
      //ex. profile.profile_id
      : { table: columnPath[0], name: columnPath[1] };
    //get the right part of the selector after the selector notation (:)
    const json = selector.substring(index + length);
    //now form the json path
    const path = json.split(separator).filter(Boolean);
    return new SqliteJsonDialect(column, path, quote);
  }

  //ex. $
  //ex. $.firstName
  //ex. $.settings.theme
  //ex. $.tags[0]
  public readonly selector: string;
  //ex. json_extract(data, '$.firstName')
  public readonly extract: string;
  //ex. EXISTS (SELECT 1 FROM json_each(data, '$.tags') WHERE value = ?)
  public readonly contains: string;

  /**
   * Sets the selector and extract properties 
   * based on the column and path provided.
   */
  public constructor(column: Column, path: string[], q: string) {
    //convert paths to proper JSON selectors
    const selectors = path.map(path => (
      isIndex.test(path) ? `[${path}]` : `.${path}`
    ));

    const select = column.table
      ? `${q}${column.table}${q}.${q}${column.name}${q}`
      : `${q}${column.name}${q}`;

    this.selector = '$' + selectors.join('');
    this.extract = `json_extract(${select}, '${this.selector}')`;

    const each = `json_each(${select}, '${this.selector}')`;
    this.contains = `EXISTS (SELECT 1 FROM ${each} WHERE value = ?)`;
  }

  /**
   * Returns a JSON selector clause for the given operator and value.
   */
  public where(clause: string, replace: string) {
    return clause.replaceAll(replace, this.extract);
  }
};

export default new SqliteDialect();