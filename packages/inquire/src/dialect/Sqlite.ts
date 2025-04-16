//builder
import type Alter from '../builder/Alter.js';
import type Create from '../builder/Create.js';
import type Delete from '../builder/Delete.js';
import type Insert from '../builder/Insert.js';
import type Select from '../builder/Select.js';
import type Update from '../builder/Update.js';
//common
import type { 
  Join, 
  Value, 
  FlatValue, 
  Dialect, 
  QueryObject 
} from '../types.js';
import Exception from '../Exception.js';
import { joins } from '../helpers.js';

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

export function getType(key: string, length?: number | [ number, number ]) {
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
};

const Sqlite: Dialect = {
  /**
   * Recommended quote character
   */
  q, 

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
        query: `ALTER TABLE ${q}${build.table}${q} DROP COLUMN ${q}${name}${q}`,
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
      const { type, length } = getType(field.type, field.length);
      column.push(`${q}${name}${q}`);
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
      field.nullable && column.push('NOT NULL');
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
        query: `ALTER TABLE ${q}${build.table}${q} ADD COLUMN ${column.join(' ')}`,
        values: []
      });
    });

    //----------------------------------------------------------------//
    // Update columns
    //
    // ALTER TABLE table_name ALTER COLUMN column_name SET DATA TYPE data_type;

    Object.keys(build.fields.update).map(name => {
      const field = build.fields.update[name];
      let { type, length } = getType(field.type, field.length);
      
      if (type === 'REAL' || type === 'INTEGER') {
      } else if (Array.isArray(length)) {
        type = `${type}(${length.join(', ')})`;
      } else if (length) {
        type = `${type}(${length})`;
      }
      //SQLite does not support modifying column constraints (like NOT NULL, DEFAULT) directly.
      transactions.push({
        query: `ALTER TABLE ${q}${build.table}${q} ALTER COLUMN ${q}${name}${q} SET DATA TYPE ${type}`,
        values: []
      });
    });

    //----------------------------------------------------------------//
    // Remove unique keys
    //
    // DROP INDEX index_name;

    build.unique.remove.forEach(name => {
      transactions.push({
        query: `DROP INDEX ${q}${name}${q}`,
        values: []
      });
    });

    //----------------------------------------------------------------//
    // Add unique keys
    //
    // CREATE UNIQUE INDEX new_index_name ON table_name(new_column1, new_column2);

    Object.entries(build.unique.add).forEach(([name, values]) => {
      transactions.push({ 
        query: `CREATE UNIQUE INDEX ${q}${name}${q} ON ${q}${build.table}${q}(${q}${values.join(`${q}, ${q}`)}${q})`, 
        values: [] 
      });
    });

    //----------------------------------------------------------------//
    // Remove keys
    //
    // DROP INDEX index_name;

    build.keys.remove.forEach(name => {
      transactions.push({
        query: `DROP INDEX ${q}${name}${q}`,
        values: []
      });
    });

    //----------------------------------------------------------------//
    // Add keys
    //
    // CREATE INDEX new_index_name ON table_name(new_column1, new_column2);

    Object.entries(build.keys.add).forEach(([name, values]) => {
      transactions.push({ 
        query: `CREATE INDEX ${q}${name}${q} ON ${q}${build.table}${q}(${q}${values.join(`${q}, ${q}`)}${q})`, 
        values: [] 
      });
    });

    if (transactions.length === 0) {
      throw Exception.for('No alterations made.')
    }
    return transactions;
  },

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
      const { type, length } = getType(field.type, field.length);
      column.push(`${q}${name}${q}`);
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
      field.nullable && column.push('NOT NULL');
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
          `FOREIGN KEY (${q}${info.local}${q})`,
          `REFERENCES ${q}${info.table}${q}(${q}${info.foreign}${q})`,
          info.delete ? `ON DELETE ${info.delete}`: '', 
          info.update ? `ON UPDATE ${info.update}`: ''
        ].join(' ');
      }));
    }

    transactions.push({ 
      query: `CREATE TABLE IF NOT EXISTS ${q}${build.table}${q} (${fields.join(', ')})`, 
      values: [] 
    });

    //----------------------------------------------------------------//
    // Add unique keys
    //
    // CREATE UNIQUE INDEX new_index_name ON table_name(new_column1, new_column2);

    Object.entries(build.unique).forEach(([name, values]) => {
      transactions.push({ 
        query: `CREATE UNIQUE INDEX ${q}${name}${q} ON ${q}${build.table}${q}(${q}${values.join(`${q}, ${q}`)}${q})`, 
        values: [] 
      });
    });

    //----------------------------------------------------------------//
    // Add keys
    //
    // CREATE INDEX new_index_name ON table_name(new_column1, new_column2);

    Object.entries(build.keys).forEach(([name, values]) => {
      transactions.push({ 
        query: `CREATE INDEX ${q}${name}${q} ON ${q}${build.table}${q}(${q}${values.join(`${q}, ${q}`)}${q})`, 
        values: [] 
      });
    });

    return transactions;
  },

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
    query.push(`DELETE FROM ${q}${build.table}${q}`);

    const filters = build.filters.map(filter => {
      values.push(...filter[1]);
      return filter[0];
    }).join(' AND ');
    query.push(`WHERE ${filters}`);

    return { query: query.join(' '), values };
  },

  /**
   * Drops a table
   */
  drop(table: string) {
    return { query: `DROP TABLE IF EXISTS ${q}${table}${q}`, values: [] };
  },

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
    
    query.push(`INSERT INTO ${q}${build.table}${q}`);

    const keys = Object.keys(build.values[0]);
    query.push(`(${q}${keys.join(`${q}, ${q}`)}${q})`);

    const row = build.values.map((value) => {
      const row = keys.map(key => value[key]);
      values.push(...row);
      return `(${row.map(() => '?').join(', ')})`;
    });

    query.push(`VALUES ${row.join(', ')}`);
    if (build.returning.length) {
      query.push(`RETURNING ${build.returning.map(
        column => column !== '*' ? `${q}${column}${q}` : column
      ).join(', ')}`);
    }
    return { query: query.join(' '), values };
  },

  /**
   * Renames a table
   */
  rename(from: string, to: string) {
    return { 
      query: `ALTER TABLE ${q}${from}${q} RENAME TO ${q}${to}${q}`, 
      values: [] 
    };
  },

  /**
   * Converts select builder to query and values
   */
  select(builder: Select) {
    const build = builder.build();
    if (!build.table) {
      throw Exception.for('No table specified');
    }

    const query: string[] = [];
    const values: FlatValue[] = [];
    const columns = build.columns
      .map(column => column.split(','))
      .flat(1)
      .map(column => column.trim())
      .filter(Boolean);

    query.push(`SELECT ${columns.join(', ')}`);
    if (build.table) {
      if (build.table[1] !== build.table[0]) {
        query.push(`FROM ${q}${build.table[0]}${q} AS ${q}${build.table[1]}${q}`);
      } else {
        query.push(`FROM ${q}${build.table[0]}${q}`);
      }
    }

    if (build.relations.length) {
      const relations = build.relations.map(relation => {
        const type = relation.type as Join;
        const table = relation.table !== relation.as 
          ? `${q}${relation.table}${q} AS ${q}${relation.as}${q}`
          : `${q}${relation.table}${q}`;
        return `${joins[type]} JOIN ${table} ON (${q}${relation.from}${q} = ${q}${relation.to}${q})`;
      });
      query.push(relations.join(' '));
    }

    if (build.filters.length) {
      const filters = build.filters.map(filter => {
        values.push(...filter[1]);
        return filter[0];
      }).join(' AND ');
      query.push(`WHERE ${filters}`);
    }

    if (build.sort.length) {
      const sort = build.sort.map((sort) => `${q}${sort[0]}${q} ${sort[1].toUpperCase()}`);
      query.push(`ORDER BY ${sort.join(`, `)}`);
    }

    if (build.limit) {
      query.push(`LIMIT ${build.limit}`);
    }

    if (build.offset) {
      query.push(`OFFSET ${build.offset}`);
    }

    return { query: query.join(' '), values };
  },

  /**
   * Truncate table
   */
  truncate(table: string, cascade = false) {
    return { 
      query: `TRUNCATE TABLE ${q}${table}${q}${cascade ? ' CASCADE' : ''}`, 
      values: [] 
    };
  },

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

    query.push(`UPDATE ${q}${build.table}${q}`);

    if (Object.keys(build.data).length) {
      const data = Object.keys(build.data).map(key => {
        values.push(build.data[key]);
        return `${q}${key}${q} = ?`;
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
  },
};

export default Sqlite;