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
  Dialect
} from '../types.js';
import Exception from '../Exception.js';
import { joins } from '../helpers.js';

//The character used to quote identifiers.
export const q = '`';

export const typemap: Record<string, string> = {
  object: 'JSON',
  hash: 'JSON',
  json: 'JSON',
  char: 'CHAR',
  string: 'VARCHAR',
  varchar: 'VARCHAR',
  text: 'TEXT',
  bool: 'BOOLEAN',
  boolean: 'BOOLEAN',
  number: 'INT',
  int: 'INT',
  integer: 'INT',
  float: 'FLOAT',
  date: 'DATE',
  datetime: 'DATETIME',
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
    } else if (type === 'INT' || type === 'FLOAT') {
      //make sure there's a length
      length = length || 11;
    }
    //if int
    if (type === 'INT') {
      //determine what kind of int
      if (length === 1) {
        type = 'TINYINT';
        length = undefined;
      } else if (length && length > 11) {
        type = 'BIGINT';
        length = undefined;
      }
    }
  }
  return { type, length };
};

const Mysql: Dialect = {
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
    // DROP column1_name

    const removeFields = build.fields.remove.map(
      name => `DROP ${q}${name}${q}`
    );

    //----------------------------------------------------------------//
    // Add field
    //
    // ADD COLUMN column1_name data_type(length) [column_constraint]

    const addFields = Object.keys(build.fields.add).map(name => {
      const field = build.fields.add[name];
      const column: string[] = [];
      const { type, length } = getType(field.type, field.length);
      column.push(`${q}${name}${q}`);
      if (Array.isArray(length)) {
        column.push(`${type}(${length.join(', ')})`);
      } else if (length) {
        column.push(`${type}(${length})`);
      } else {
        column.push(type);
      }
      field.attribute && column.push(field.attribute);
      field.unsigned && column.push('UNSIGNED');
      field.nullable && column.push('NOT NULL');
      field.autoIncrement && column.push('AUTO_INCREMENT');
      if (field.default) {
        if (typeof field.default === 'boolean') {
          column.push(`DEFAULT ${field.default ? 'TRUE' : 'FALSE'}`);
        } else if (!isNaN(Number(field.default))) {
          column.push(`DEFAULT ${field.default}`);
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

      return `ADD COLUMN ${column.join(' ')}`;
    });

    //----------------------------------------------------------------//
    // Change field
    //
    // CHANGE COLUMN column1_name data_type(length) [column_constraint]

    const changeFields = Object.keys(build.fields.update).map(name => {
      const field = build.fields.update[name];
      const column: string[] = [];
      const { type, length } = getType(field.type, field.length);
      column.push(`${q}${name}${q}`);
      if (Array.isArray(length)) {
        column.push(`${type}(${length.join(', ')})`);
      } else if (length) {
        column.push(`${type}(${length})`);
      } else {
        column.push(type);
      }
      field.attribute && column.push(field.attribute);
      field.unsigned && column.push('UNSIGNED');
      field.nullable && column.push('NOT NULL');
      field.autoIncrement && column.push('AUTO_INCREMENT');
      if (field.default) {
        if (!isNaN(Number(field.default))) {
          column.push(`DEFAULT ${field.default}`);
        } else {
          column.push(`DEFAULT '${field.default}'`);
        }
      } else if (field.nullable) {
        column.push('DEFAULT NULL');
      }

      return `CHANGE COLUMN ${column.join(' ')}`;
    });

    //----------------------------------------------------------------//
    // Drop primary key
    //
    // DROP PRIMARY KEY column1_name

    const removePrimaries = build.primary.remove.map(
      name => `DROP PRIMARY KEY ${q}${name}${q}`
    );

    //----------------------------------------------------------------//
    // Add primary key
    //
    // ADD PRIMARY KEY (column1_name, column2_name)

    const addPrimaries = build.primary.add.length 
      ? [ `ADD PRIMARY KEY (${q}${build.primary.add.join(`${q}, ${q}`)}${q})` ]
      : [];
    
    //----------------------------------------------------------------//
    // Drop unique key
    //
    // DROP UNIQUE column1_name

    const removeUniques = build.unique.remove.map(
      name => `DROP UNIQUE ${q}${name}${q}`
    );

    //----------------------------------------------------------------//
    // Add unique key
    //
    // ADD UNIQUE column1_name (column1_name, column2_name)

    const addUniques = Object.keys(build.unique.add).map(
      key => `ADD UNIQUE ${q}${key}${q} (${q}${build.unique.add[key].join(`${q}, ${q}`)}${q})`
    );

    //----------------------------------------------------------------//
    // Drop key
    //
    // DROP INDEX column1_name

    const removeKeys = build.keys.remove.map(
      name => `DROP INDEX ${q}${name}${q}`
    );

    //----------------------------------------------------------------//
    // Add key
    //
    // ADD INDEX column1_name (column1_name, column2_name)

    const addKeys = Object.keys(build.keys.add).map(
      key => `ADD INDEX ${q}${key}${q} (${q}${build.keys.add[key].join(`${q}, ${q}`)}${q})`
    );

    //----------------------------------------------------------------//
    // Drop foreign key
    //
    // DROP FOREIGN KEY column1_name

    const removeForeignKeys = build.foreign.remove.map(
      name => `DROP FOREIGN KEY ${q}${name}${q}`
    );

    //----------------------------------------------------------------//
    // Add foreign keys
    //
    // FOREIGN KEY (column1_name) REFERENCES table_name(column1_name)
    // ON DELETE CASCADE
    // ON UPDATE RESTRICT
    const addForeignKeys = Object.entries(build.foreign.add).map(([ name, info ]) => {
      return [
        `ADD CONSTRAINT ${q}${name}${q} FOREIGN KEY (${q}${info.local}${q})`,
        `REFERENCES ${q}${info.table}${q}(${q}${info.foreign}${q})`,
        info.delete ? `ON DELETE ${info.delete}`: '', 
        info.update ? `ON UPDATE ${info.update}`: ''
      ].join(' ');
    });

    if (!removeFields.length
      && !addFields.length
      && !changeFields.length
      && !removePrimaries.length
      && !addPrimaries.length
      && !removeUniques.length
      && !addUniques.length
      && !removeKeys.length
      && !addKeys.length
      && !removeForeignKeys.length
      && !addForeignKeys.length
    ) {
      throw Exception.for('No alterations made.')
    }

    query.push(
      ...removeFields,
      ...addFields,
      ...changeFields,
      ...removePrimaries,
      ...addPrimaries,
      ...removeUniques,
      ...addUniques,
      ...removeKeys,
      ...addKeys,
      ...removeForeignKeys,
      ...addForeignKeys
    );
    return [
      { 
        query: `ALTER TABLE ${q}${build.table}${q} (${query.join(', ')})`, 
        values: [] 
      }
    ];
  },

  /**
   * Converts create builder to query and values
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
      if (Array.isArray(length)) {
        column.push(`${type}(${length.join(', ')})`);
      } else if (length) {
        column.push(`${type}(${length})`);
      } else {
        column.push(type);
      }
      field.attribute && column.push(field.attribute);
      field.unsigned && column.push('UNSIGNED');
      field.nullable && column.push('NOT NULL');
      field.autoIncrement && column.push('AUTO_INCREMENT');
      if (field.default) {
        if (typeof field.default === 'boolean') {
          column.push(`DEFAULT ${field.default ? 'TRUE' : 'FALSE'}`);
        } else if (!isNaN(Number(field.default))) {
          column.push(`DEFAULT ${field.default}`);
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
    // UNIQUE KEY name (column1_name, column2_name)

    if (Object.keys(build.keys).length) {
      query.push(', ' + Object.keys(build.unique).map(
        key => `UNIQUE KEY ${q}${key}${q} (${q}${build.unique[key].join(`${q}, ${q}`)}${q})`
      ).join(', '));
    }

    //----------------------------------------------------------------//
    // Add keys
    //
    // KEY name (column1_name, column2_name)

    if (Object.keys(build.keys).length) {
      query.push(', ' + Object.keys(build.keys).map(
        key => `KEY ${q}${key}${q} (${q}${build.keys[key].join(`${q}, ${q}`)}${q})`
      ).join(', '));
    }

    //----------------------------------------------------------------//
    // Add foreign keys
    //
    // FOREIGN KEY (column1_name) REFERENCES table_name(column1_name)
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

    return [
      { 
        query: `CREATE TABLE IF NOT EXISTS ${q}${build.table}${q} (${query.join(' ')})`, 
        values: [] 
      }
    ];
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

export default Mysql;