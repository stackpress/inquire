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
export const q = '"';

export const typemap: Record<string, string> = {
  object: 'JSONB',
  hash: 'JSONB',
  json: 'JSONB',
  char: 'CHAR',
  string: 'VARCHAR',
  varchar: 'VARCHAR',
  text: 'TEXT',
  bool: 'BOOLEAN',
  boolean: 'BOOLEAN',
  number: 'INTEGER',
  int: 'INTEGER',
  integer: 'INTEGER',
  float: 'DECIMAL',
  date: 'DATE',
  datetime: 'TIMESTAMP',
  time: 'TIME'
};

export class PgsqlDialect implements Dialect {
  //The name of the dialect, used for logging and error messages.
  public readonly name = 'pgsql';
  //Recommended quote character
  public readonly q = q;

  //used for json notation
  public separator: string = '.';
  public splitter: string = ':';

  /**
   * Converts alter builder to query and values
   */
  alter(builder: Alter) {
    const build = builder.build();
    const query: string[] = [];

    //----------------------------------------------------------------//
    // Drop field
    //
    // DROP COLUMN `name`

    build.fields.remove.forEach(name => {
      query.push(`ALTER TABLE ${this.q}${build.table}${this.q} DROP COLUMN ${this.q}${name}${this.q}`);
    });

    //----------------------------------------------------------------//
    // Add field
    //
    // ADD COLUMN `name` `type` (`length`) `attribute` `unsigned` `nullable` `autoIncrement` `default`

    Object.keys(build.fields.add).forEach(name => {
      const field = build.fields.add[name];
      const column: string[] = [];
      const { type, length } = this._getType(field.type, field.length);
      column.push(`${this.q}${name}${this.q}`);
      if (field.autoIncrement) {
        column.push('SERIAL');
      } else if (type === 'FLOAT' || type === 'INTEGER') {
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
        column.push(`DEFAULT ${this._getDefault(field.default, type)}`);
      } else if (field.nullable) {
        column.push('DEFAULT NULL');
      }

      query.push(
        `ALTER TABLE ${this.q}${build.table}${this.q} `
        + `ADD COLUMN ${column.join(' ')}`
      );
    });

    //----------------------------------------------------------------//
    // Change field
    //
    // ALTER COLUMN `name` `type` (`length`) `attribute` `unsigned` `nullable` `autoIncrement` `default`

    Object.keys(build.fields.update).forEach(name => {
      const field = build.fields.update[name];
      const { type, length } = this._getType(field.type, field.length);
      if (field.autoIncrement) {
        query.push(
          `ALTER TABLE ${this.q}${build.table}${this.q} `
          + `ALTER COLUMN ${this.q}${name}${this.q} TYPE SERIAL`
        );
      } else if (type === 'FLOAT' || type === 'INTEGER') {
        query.push(
          `ALTER TABLE ${this.q}${build.table}${this.q} ` 
          + `ALTER COLUMN ${this.q}${name}${this.q} TYPE ${type}`
        );
      } else if (Array.isArray(length)) {
        query.push(
          `ALTER TABLE ${this.q}${build.table}${this.q} ` 
          + `ALTER COLUMN ${this.q}${name}${this.q} TYPE ${type}(${length.join(', ')})`
        );
      } else if (length) {
        query.push(
          `ALTER TABLE ${this.q}${build.table}${this.q} ` 
          + `ALTER COLUMN ${this.q}${name}${this.q} TYPE ${type}(${length})`
        );
      } else {
        query.push(
          `ALTER TABLE ${this.q}${build.table}${this.q} ` 
          + `ALTER COLUMN ${this.q}${name}${this.q} TYPE ${type}`
        );
      }
      if (typeof field.nullable === 'boolean' && !field.nullable) {
        query.push(
          `ALTER TABLE ${this.q}${build.table}${this.q} ` 
          + `ALTER COLUMN ${this.q}${name}${this.q} SET NOT NULL`
        );
      }
      if (field.default) {
        query.push(
          `ALTER TABLE ${this.q}${build.table}${this.q} ` 
          + `ALTER COLUMN ${this.q}${name}${this.q} SET DEFAULT ${
            this._getDefault(field.default, type)
          }`
        );
      } else if (field.nullable) {
        query.push(
          `ALTER TABLE ${this.q}${build.table}${this.q} ` 
          + `ALTER COLUMN ${this.q}${name}${this.q} SET DEFAULT NULL`
        );
      }
    });

    //----------------------------------------------------------------//
    // Remove primary keys
    //
    // DROP CONSTRAINT `name`

    build.primary.remove.forEach(name => {
      query.push(
        `ALTER TABLE ${this.q}${build.table}${this.q} `
        + `DROP CONSTRAINT ${this.q}${name}${this.q}`
      );
    });

    //----------------------------------------------------------------//
    // Add primary keys
    //
    // ADD PRIMARY KEY (`name`, `name`)

    if (build.primary.add.length) {
      query.push(
        `ALTER TABLE ${this.q}${build.table}${this.q} `
        +`ADD PRIMARY KEY (${this.q}${build.primary.add.join(`${this.q}, ${this.q}`)}${this.q})`
      );
    }

    //----------------------------------------------------------------//
    // Drop unique keys
    // 
    // DROP UNIQUE `name`

    build.unique.remove.forEach(name => {
      query.push(
        `ALTER TABLE ${this.q}${build.table}${this.q} `
        + `DROP UNIQUE ${this.q}${name}${this.q}`
      );
    });

    //----------------------------------------------------------------//
    // Add unique keys
    //
    // ADD UNIQUE `name` (`name`, `name`)

    Object.keys(build.unique.add).forEach(key => {
      query.push(
        `ALTER TABLE ${this.q}${build.table}${this.q} `
        + `ADD UNIQUE ${this.q}${key}${this.q} (${this.q}${build.unique.add[key].join(`${this.q}, ${this.q}`)}${this.q})`
      );
    });

    //----------------------------------------------------------------//
    // Drop keys
    //
    // DROP INDEX `name`

    build.keys.remove.forEach(name => {
      query.push(
        `ALTER TABLE ${this.q}${build.table}${this.q} `
        + `DROP INDEX ${this.q}${name}${this.q}`);
    });

    //----------------------------------------------------------------//
    // Add keys
    //
    // ADD INDEX `name` (`name`, `name`)

    Object.keys(build.keys.add).forEach(key => {
      query.push(
        `ALTER TABLE ${this.q}${build.table}${this.q} `
        + `ADD INDEX ${this.q}${key}${this.q} (${this.q}${build.keys.add[key].join(`${this.q}, ${this.q}`)}${this.q})`
      );
    });

    //----------------------------------------------------------------//
    // Drop foreign key
    //
    // DROP CONSTRAINT column1_name

    build.foreign.remove.forEach(name => {
      query.push(
        `ALTER TABLE ${this.q}${build.table}${this.q} `
        + `DROP CONSTRAINT ${this.q}${name}${this.q}`);
    });

    //----------------------------------------------------------------//
    // Add foreign keys
    //
    // FOREIGN KEY (column1_name) REFERENCES table_name(column1_name)
    // ON DELETE CASCADE
    // ON UPDATE RESTRICT
    Object.entries(build.foreign.add).forEach(([ name, info ]) => {
      query.push(
        `ALTER TABLE ${this.q}${build.table}${this.q} `
        + `ADD CONSTRAINT ${this.q}${name}${this.q} FOREIGN KEY (${this.q}${info.local}${this.q}) `
        + `REFERENCES ${this.q}${info.table}${this.q}(${this.q}${info.foreign}${this.q}) `
        + (info.delete ? `ON DELETE ${info.delete} `: '')
        + (info.update ? `ON UPDATE ${info.update} `: '')
      );
    });

    if (!query.length) {
      throw Exception.for('No alterations made.')
    }
    return query.map(query => ({ query, values: [] }));
  }

  /**
   * Converts create builder to query and values
   * results: [ { rows: [], fields: [], affectedRows: 0 } ]
   */
  create(builder: Create) {
    const build = builder.build();
    if (!Object.values(build.fields).length) {
      throw Exception.for('No fields provided');
    }

    const query: string[] = [];

    //----------------------------------------------------------------//
    // Add field
    //
    // column1_name data_type(length) [column_constraint]

    const fields = Object.keys(build.fields).map(name => {
      const field = build.fields[name];
      const column: string[] = [];
      const { type, length } = this._getType(field.type, field.length);
      column.push(`${this.q}${name}${this.q}`);
      if (field.autoIncrement) {
        column.push('SERIAL');
      } else if (type === 'FLOAT' || type === 'INTEGER') {
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
        column.push(`DEFAULT ${this._getDefault(field.default, type)}`);
      } else if (field.nullable) {
        column.push('DEFAULT NULL');
      }

      return column.join(' ');
    }).join(', ');

    query.push(fields);

    //----------------------------------------------------------------//
    // Add primary keys
    //
    // PRIMARY KEY (column1_name, column2_name)
  
    if (build.primary.length) {
      query.push(`, PRIMARY KEY (${build.primary
        .map(key => `${this.q}${key}${this.q}`)
        .join(', ')})`
      );
    }

    //----------------------------------------------------------------//
    // Add unique keys
    //
    // UNIQUE name (column1_name, column2_name)

    if (Object.keys(build.unique).length) {
      query.push(', ' + Object.keys(build.unique).map(
        key => `UNIQUE (${this.q}${build.unique[key].join(`${this.q}, ${this.q}`)}${this.q})`
      ).join(', '));
    }

    //----------------------------------------------------------------//
    // Add foreign keys
    //
    // CONSTRAINT fk_customer FOREIGN KEY (customer_id)
    // REFERENCES customers(customer_id)
    // ON DELETE CASCADE
    // ON UPDATE RESTRICT
    if (Object.keys(build.foreign).length) {
      query.push(', ' + Object.entries(build.foreign).map(([ name, info ]) => {
        return [
          `CONSTRAINT ${this.q}${name}${this.q} FOREIGN KEY (${this.q}${info.local}${this.q})`,
          `REFERENCES ${this.q}${info.table}${this.q}(${this.q}${info.foreign}${this.q})`,
          info.delete ? `ON DELETE ${info.delete}`: '', 
          info.update ? `ON UPDATE ${info.update}`: ''
        ].join(' ');
      }).join(', '));
    }

    const transactions: QueryObject[] = [
      { 
        query: `CREATE TABLE IF NOT EXISTS ${this.q}${build.table}${this.q} (${query.join(' ')})`, 
        values: [] 
      }
    ];

    //----------------------------------------------------------------//
    // Add keys
    //
    // CREATE INDEX "price" ON products ("name")

    if (Object.keys(build.keys).length) {
      Object.keys(build.keys).forEach(key => {
        transactions.push({
          query: `CREATE INDEX ${this.q}${key}${this.q} ON ${this.q}${build.table}${this.q}(${this.q}${build.keys[key].join(`${this.q}, ${this.q}`)}${this.q})`,
          values: []
        });
      });
    }

    return transactions;
  }

  /**
   * Converts delete builder to query and values
   * results: [ { rows: [], fields: [], affectedRows: 0 } ]
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
   * results: [ { rows: [], fields: [], affectedRows: 0 } ]
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

    const rows = build.values.map((value) => {
      const row = keys.map(key => value[key]);
      values.push(...row);
      return `(${row.map(() => '?').join(', ')})`;
    });

    query.push(`VALUES ${rows.join(', ')}`);
    
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
      return PgsqlJsonDialect.parse(
        column, 
        path || ':', 
        separator || '.',
        this.q
      );
    }
    //split the by . and remove empty ones
    const columnPath = column.split('.').filter(Boolean);
    return new PgsqlJsonDialect(
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
      query: `RENAME TABLE ${this.q}${from}${this.q} TO ${this.q}${to}${this.q}`, 
      values: [] 
    };
  }

  /**
   * Converts select builder to query and values
   * results: [{"rows":[],"fields":[{"name":"id","dataTypeID":1043}...],"affectedRows":0}]
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
            const json = PgsqlJsonDialect.parse(
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
        const json = PgsqlJsonDialect.parse(
          filter.selector, 
          this.splitter, 
          this.separator
        );
        //if invalid JSON selector, skip it
        if (!json) return;
        //make a temporary or query object to hold the JSON filters
        const or: OrQueryObject<JSONScalarValue> = { query: [], values: [] };

        //if the operator is contains
        if (query === 'contains') {
          filter.values.forEach(value => {
            or.query.push(json.contains);
            or.values.push(value);
          });
        //compare it to the value
        } else {
          //we are doing the clause formation this
          //way to make sure $ isn't removed
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
          const json = PgsqlJsonDialect.parse(
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
   * results: [ { rows: [], fields: [], affectedRows: 0 } ]
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
   * Returns a default value for the given value 
   * and type, properly formatted for SQL.
   */
  protected _getDefault(value: any, type: string) {
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    } else if (typeof value === 'number' || !isNaN(Number(value))) {
      return value;
    } else if (typeof value === 'string' && value.endsWith('()')) {
      if (value.toLowerCase() === 'now()') {
        if (type === 'TIMESTAMP') {
          return 'CURRENT_TIMESTAMP';
        } else if (type === 'DATE') {
          return 'CURRENT_DATE';
        } else if (type === 'TIME') {
          return 'CURRENT_TIME';
        }
      }
      return value.toUpperCase();
    } else if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }
    return `'${value}'`;
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
      //if number
      } else if (type === 'INTEGER' || type === 'FLOAT') {
        //make sure there's a length
        length = length || 11;
      }
      //if int
      if (type === 'INTEGER') {
        //determine what kind of int
        if (length === 1) {
          type = 'SMALLINT';
          length = undefined;
        } else if (length && length > 11) {
          type = 'BIGINT';
          length = undefined;
        }
      }
    }
    return { type, length };
  }
}
export class PgsqlJsonDialect implements JsonDialect {
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
      return new PgsqlJsonDialect(column, [], quote);
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
    return new PgsqlJsonDialect(column, path, quote);
  }

  //ex. ->>$$firstName$$
  //ex. ->$$settings$$->>$$theme$$
  //ex. ->$$tags$$->>0
  public readonly selector: string;
  //ex. user->>$$firstName$$
  public readonly extract: string;
  //ex. user->>$$firstName$$ ?? ?
  public readonly contains: string;

  /**
   * Sets the selector and extract properties 
   * based on the column and path provided.
   */
  public constructor(column: Column, path: string[], q: string) {
    const paths = [ ...path ];
    //the last one has a special annotation...
    const last = paths.pop();
    //convert paths to proper JSON selectors
    const selectors = paths.map(path => (
      isIndex.test(path) ? `->${path}` : `->$$${path}$$`
    ));
    last && selectors.push(isIndex.test(last) 
      ? `->>${last}` 
      : `->>$$${last}$$`);

    const select = column.table
      ? `${q}${column.table}${q}.${q}${column.name}${q}`
      : `${q}${column.name}${q}`;

    this.selector = selectors.join('');
    this.extract = `${select}${this.selector}`;
    this.contains = `${this.extract.replace('->>', '->')} ?? ?`;
  }

  /**
   * Returns a JSON selector clause for the given operator and value.
   */
  public where(clause: string, replace: string) {
    //$$$$ escapes $ in the selector so 
    // it isn't replaced by a single $
    return clause.replaceAll(replace, this.extract.replace(/\$/g, '$$$$'));
  }
};

export default new PgsqlDialect();