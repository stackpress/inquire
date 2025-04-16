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

export function getType(key: string, length?: number | [ number, number ]) {
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
};

export function getDefault(value: any, type: string) {
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  } else if (typeof value === 'number' || !isNaN(Number(value))) {
    return value;
  } else if (typeof value === 'string') {
    if (/^[A-Z_]+$/g.test(value)) {
      return value;
    } else if (value.endsWith('()')) {
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
    }
  } else if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return `'${value}'`;
};

const Pgsql: Dialect = {
  /**
   * Recommended quote character
   */
  q, 
  
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
      query.push(`ALTER TABLE ${q}${build.table}${q} DROP COLUMN ${q}${name}${q}`);
    });

    //----------------------------------------------------------------//
    // Add field
    //
    // ADD COLUMN `name` `type` (`length`) `attribute` `unsigned` `nullable` `autoIncrement` `default`

    Object.keys(build.fields.add).forEach(name => {
      const field = build.fields.add[name];
      const column: string[] = [];
      const { type, length } = getType(field.type, field.length);
      column.push(`${q}${name}${q}`);
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
        column.push(`DEFAULT ${getDefault(field.default, type)}`);
      } else if (field.nullable) {
        column.push('DEFAULT NULL');
      }

      query.push(
        `ALTER TABLE ${q}${build.table}${q} `
        + `ADD COLUMN ${column.join(' ')}`
      );
    });

    //----------------------------------------------------------------//
    // Change field
    //
    // ALTER COLUMN `name` `type` (`length`) `attribute` `unsigned` `nullable` `autoIncrement` `default`

    Object.keys(build.fields.update).forEach(name => {
      const field = build.fields.update[name];
      const { type, length } = getType(field.type, field.length);
      if (field.autoIncrement) {
        query.push(
          `ALTER TABLE ${q}${build.table}${q} `
          + `ALTER COLUMN ${q}${name}${q} TYPE SERIAL`
        );
      } else if (type === 'FLOAT' || type === 'INTEGER') {
        query.push(
          `ALTER TABLE ${q}${build.table}${q} ` 
          + `ALTER COLUMN ${q}${name}${q} TYPE ${type}`
        );
      } else if (Array.isArray(length)) {
        query.push(
          `ALTER TABLE ${q}${build.table}${q} ` 
          + `ALTER COLUMN ${q}${name}${q} TYPE ${type}(${length.join(', ')})`
        );
      } else if (length) {
        query.push(
          `ALTER TABLE ${q}${build.table}${q} ` 
          + `ALTER COLUMN ${q}${name}${q} TYPE ${type}(${length})`
        );
      } else {
        query.push(
          `ALTER TABLE ${q}${build.table}${q} ` 
          + `ALTER COLUMN ${q}${name}${q} TYPE ${type}`
        );
      }
      if (typeof field.nullable === 'boolean' && !field.nullable) {
        query.push(
          `ALTER TABLE ${q}${build.table}${q} ` 
          + `ALTER COLUMN ${q}${name}${q} SET NOT NULL`
        );
      }
      if (field.default) {
        query.push(
          `ALTER TABLE ${q}${build.table}${q} ` 
          + `ALTER COLUMN ${q}${name}${q} SET DEFAULT ${getDefault(field.default, type)}`
        );
      } else if (field.nullable) {
        query.push(
          `ALTER TABLE ${q}${build.table}${q} ` 
          + `ALTER COLUMN ${q}${name}${q} SET DEFAULT NULL`
        );
      }
    });

    //----------------------------------------------------------------//
    // Remove primary keys
    //
    // DROP CONSTRAINT `name`

    build.primary.remove.forEach(name => {
      query.push(
        `ALTER TABLE ${q}${build.table}${q} `
        + `DROP CONSTRAINT ${q}${name}${q}`
      );
    });

    //----------------------------------------------------------------//
    // Add primary keys
    //
    // ADD PRIMARY KEY (`name`, `name`)

    if (build.primary.add.length) {
      query.push(
        `ALTER TABLE ${q}${build.table}${q} `
        +`ADD PRIMARY KEY (${q}${build.primary.add.join(`${q}, ${q}`)}${q})`
      );
    }

    //----------------------------------------------------------------//
    // Drop unique keys
    // 
    // DROP UNIQUE `name`

    build.unique.remove.forEach(name => {
      query.push(
        `ALTER TABLE ${q}${build.table}${q} `
        + `DROP UNIQUE ${q}${name}${q}`
      );
    });

    //----------------------------------------------------------------//
    // Add unique keys
    //
    // ADD UNIQUE `name` (`name`, `name`)

    Object.keys(build.unique.add).forEach(key => {
      query.push(
        `ALTER TABLE ${q}${build.table}${q} `
        + `ADD UNIQUE ${q}${key}${q} (${q}${build.unique.add[key].join(`${q}, ${q}`)}${q})`
      );
    });

    //----------------------------------------------------------------//
    // Drop keys
    //
    // DROP INDEX `name`

    build.keys.remove.forEach(name => {
      query.push(
        `ALTER TABLE ${q}${build.table}${q} `
        + `DROP INDEX ${q}${name}${q}`);
    });

    //----------------------------------------------------------------//
    // Add keys
    //
    // ADD INDEX `name` (`name`, `name`)

    Object.keys(build.keys.add).forEach(key => {
      query.push(
        `ALTER TABLE ${q}${build.table}${q} `
        + `ADD INDEX ${q}${key}${q} (${q}${build.keys.add[key].join(`${q}, ${q}`)}${q})`
      );
    });

    //----------------------------------------------------------------//
    // Drop foreign key
    //
    // DROP CONSTRAINT column1_name

    build.foreign.remove.forEach(name => {
      query.push(
        `ALTER TABLE ${q}${build.table}${q} `
        + `DROP CONSTRAINT ${q}${name}${q}`);
    });

    //----------------------------------------------------------------//
    // Add foreign keys
    //
    // FOREIGN KEY (column1_name) REFERENCES table_name(column1_name)
    // ON DELETE CASCADE
    // ON UPDATE RESTRICT
    Object.entries(build.foreign.add).forEach(([ name, info ]) => {
      query.push(
        `ALTER TABLE ${q}${build.table}${q} `
        + `ADD CONSTRAINT ${q}${name}${q} FOREIGN KEY (${q}${info.local}${q}) `
        + `REFERENCES ${q}${info.table}${q}(${q}${info.foreign}${q}) `
        + (info.delete ? `ON DELETE ${info.delete} `: '')
        + (info.update ? `ON UPDATE ${info.update} `: '')
      );
    });

    if (!query.length) {
      throw Exception.for('No alterations made.')
    }
    return query.map(query => ({ query, values: [] }));
  },

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
      const { type, length } = getType(field.type, field.length);
      column.push(`${q}${name}${q}`);
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
        column.push(`DEFAULT ${getDefault(field.default, type)}`);
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
        .map(key => `${q}${key}${q}`)
        .join(', ')})`
      );
    }

    //----------------------------------------------------------------//
    // Add unique keys
    //
    // UNIQUE name (column1_name, column2_name)

    if (Object.keys(build.unique).length) {
      query.push(', ' + Object.keys(build.unique).map(
        key => `UNIQUE (${q}${build.unique[key].join(`${q}, ${q}`)}${q})`
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
          `CONSTRAINT ${q}${name}${q} FOREIGN KEY (${q}${info.local}${q})`,
          `REFERENCES ${q}${info.table}${q}(${q}${info.foreign}${q})`,
          info.delete ? `ON DELETE ${info.delete}`: '', 
          info.update ? `ON UPDATE ${info.update}`: ''
        ].join(' ');
      }).join(', '));
    }

    const transactions: QueryObject[] = [
      { 
        query: `CREATE TABLE IF NOT EXISTS ${q}${build.table}${q} (${query.join(' ')})`, 
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
          query: `CREATE INDEX ${q}${key}${q} ON ${q}${build.table}${q}(${q}${build.keys[key].join(`${q}, ${q}`)}${q})`,
          values: []
        });
      });
    }

    return transactions;
  },

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
   * results: [ { rows: [], fields: [], affectedRows: 0 } ]
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

    const rows = build.values.map((value) => {
      const row = keys.map(key => value[key]);
      values.push(...row);
      return `(${row.map(() => '?').join(', ')})`;
    });

    query.push(`VALUES ${rows.join(', ')}`);
    
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
      query: `RENAME TABLE ${q}${from}${q} TO ${q}${to}${q}`, 
      values: [] 
    };
  },

  /**
   * Converts select builder to query and values
   * results: [{"rows":[],"fields":[{"name":"id","dataTypeID":1043}...],"affectedRows":0}]
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
   * results: [ { rows: [], fields: [], affectedRows: 0 } ]
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

export default Pgsql;