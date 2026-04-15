//builder
import type Alter from '../builder/Alter.js';
import type Create from '../builder/Create.js';
import type Delete from '../builder/Delete.js';
import type Insert from '../builder/Insert.js';
import type Select from '../builder/Select.js';
import type Update from '../builder/Update.js';
//dialect
import JsonTrait from './Json.js';
//common
import type { 
  Column,
  JoinType, 
  Value, 
  FlatValue, 
  Dialect,
  JsonDialect,
  OrQueryObject,
  JSONScalarValue
} from '../types.js';
import Exception from '../Exception.js';
import { joinTypes, isIndex, safeJsonValue } from '../helpers.js';

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

export class MysqlDialect extends JsonTrait implements Dialect {
  //The name of the dialect, used for logging and error messages.
  public readonly name = 'mysql';
  //Recommended quote character
  public readonly q = q;

  /**
   * Converts alter builder to query and values
   */
  public alter(builder: Alter) {
    const build = builder.build();
    const query: string[] = [];

    //----------------------------------------------------------------//
    // Drop field
    //
    // DROP column1_name

    const removeFields = build.fields.remove.map(
      name => `DROP ${this.q}${name}${this.q}`
    );

    //----------------------------------------------------------------//
    // Add field
    //
    // ADD COLUMN column1_name data_type(length) [column_constraint]

    const addFields = Object.keys(build.fields.add).map(name => {
      const field = build.fields.add[name];
      const column: string[] = [];
      const { type, length } = this._getType(field.type, field.length);
      column.push(`${this.q}${name}${this.q}`);
      if (Array.isArray(length)) {
        column.push(`${type}(${length.join(', ')})`);
      } else if (length) {
        column.push(`${type}(${length})`);
      } else {
        column.push(type);
      }
      field.attribute && column.push(field.attribute);
      field.unsigned && column.push('UNSIGNED');
      !field.nullable && column.push('NOT NULL');
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
      const { type, length } = this._getType(field.type, field.length);
      column.push(`${this.q}${name}${this.q}`);
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
      name => `DROP PRIMARY KEY ${this.q}${name}${this.q}`
    );

    //----------------------------------------------------------------//
    // Add primary key
    //
    // ADD PRIMARY KEY (column1_name, column2_name)

    const addPrimaries = build.primary.add.length 
      ? [ `ADD PRIMARY KEY (${this.q}${build.primary.add.join(`${this.q}, ${this.q}`)}${this.q})` ]
      : [];
    
    //----------------------------------------------------------------//
    // Drop unique key
    //
    // DROP UNIQUE column1_name

    const removeUniques = build.unique.remove.map(
      name => `DROP UNIQUE ${this.q}${name}${this.q}`
    );

    //----------------------------------------------------------------//
    // Add unique key
    //
    // ADD UNIQUE column1_name (column1_name, column2_name)

    const addUniques = Object.keys(build.unique.add).map(
      key => `ADD UNIQUE ${this.q}${key}${this.q} (${this.q}${build.unique.add[key].join(`${this.q}, ${this.q}`)}${this.q})`
    );

    //----------------------------------------------------------------//
    // Drop key
    //
    // DROP INDEX column1_name

    const removeKeys = build.keys.remove.map(
      name => `DROP INDEX ${this.q}${name}${this.q}`
    );

    //----------------------------------------------------------------//
    // Add key
    //
    // ADD INDEX column1_name (column1_name, column2_name)

    const addKeys = Object.keys(build.keys.add).map(
      key => `ADD INDEX ${this.q}${key}${this.q} (${this.q}${build.keys.add[key].join(`${this.q}, ${this.q}`)}${this.q})`
    );

    //----------------------------------------------------------------//
    // Drop foreign key
    //
    // DROP FOREIGN KEY column1_name

    const removeForeignKeys = build.foreign.remove.map(
      name => `DROP FOREIGN KEY ${this.q}${name}${this.q}`
    );

    //----------------------------------------------------------------//
    // Add foreign keys
    //
    // FOREIGN KEY (column1_name) REFERENCES table_name(column1_name)
    // ON DELETE CASCADE
    // ON UPDATE RESTRICT
    const addForeignKeys = Object.entries(build.foreign.add).map(([ name, info ]) => {
      return [
        `ADD CONSTRAINT ${this.q}${name}${this.q} FOREIGN KEY (${this.q}${info.local}${this.q})`,
        `REFERENCES ${this.q}${info.table}${this.q}(${this.q}${info.foreign}${this.q})`,
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
        query: `ALTER TABLE ${this.q}${build.table}${this.q} (${query.join(', ')})`, 
        values: [] 
      }
    ];
  }

  /**
   * Converts create builder to query and values
   */
  public create(builder: Create) {
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
      if (Array.isArray(length)) {
        column.push(`${type}(${length.join(', ')})`);
      } else if (length) {
        column.push(`${type}(${length})`);
      } else {
        column.push(type);
      }
      field.attribute && column.push(field.attribute);
      field.unsigned && column.push('UNSIGNED');
      !field.nullable && column.push('NOT NULL');
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
        .map(key => `${this.q}${key}${this.q}`)
        .join(', ')})`
      );
    }

    //----------------------------------------------------------------//
    // Add unique keys
    //
    // UNIQUE KEY name (column1_name, column2_name)

    if (Object.keys(build.keys).length) {
      query.push(', ' + Object.keys(build.unique).map(
        key => `UNIQUE KEY ${this.q}${key}${this.q} (${this.q}${build.unique[key].join(`${this.q}, ${this.q}`)}${this.q})`
      ).join(', '));
    }

    //----------------------------------------------------------------//
    // Add keys
    //
    // KEY name (column1_name, column2_name)

    if (Object.keys(build.keys).length) {
      query.push(', ' + Object.keys(build.keys).map(
        key => `KEY ${this.q}${key}${this.q} (${this.q}${build.keys[key].join(`${this.q}, ${this.q}`)}${this.q})`
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
          `CONSTRAINT ${this.q}${name}${this.q} FOREIGN KEY (${this.q}${info.local}${this.q})`,
          `REFERENCES ${this.q}${info.table}${this.q}(${this.q}${info.foreign}${this.q})`,
          info.delete ? `ON DELETE ${info.delete}`: '', 
          info.update ? `ON UPDATE ${info.update}`: ''
        ].join(' ');
      }).join(', '));
    }

    return [
      { 
        query: `CREATE TABLE IF NOT EXISTS ${this.q}${build.table}${this.q} (${query.join(' ')})`, 
        values: [] 
      }
    ];
  }

  /**
   * Converts delete builder to query and values
   */
  public delete(builder: Delete) {
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
  public drop(table: string) {
    return { query: `DROP TABLE IF EXISTS ${this.q}${table}${this.q}`, values: [] };
  }

  /**
   * Converts insert builder to query and values
   */
  public insert(builder: Insert) {
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
    return { query: query.join(' '), values };
  }

  /**
   * Returns a subset of methods for handling JSON selectors in queries.
   */
  public json(column: string, path: string[]): JsonDialect;
  public json(column: string, path?: string, separator?: string): JsonDialect;
  public json(column: string, path?: string|string[], separator?: string) {
    if (!Array.isArray(path)) {
      return MysqlJsonDialect.parse(
        column, 
        path || ':', 
        separator || '.',
        this.q
      );
    }
    //split the by . and remove empty ones
    const columnPath = column.split('.').filter(Boolean);
    return new MysqlJsonDialect(
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
  public rename(from: string, to: string) {
    return { 
      query: `RENAME TABLE ${this.q}${from}${this.q} TO ${this.q}${to}${this.q}`, 
      values: [] 
    };
  }

  /**
   * Converts select builder to query and values
   */
  public select(builder: Select) {
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
        ? [ 
            `${this.q}${selector.table}${this.q}.${name}`, 
            `${this.q}${selector.alias}${this.q}`
          ].join(' AS ')
        : selector.table
        ? `${this.q}${selector.table}${this.q}.${name}`
        : selector.alias && this._isJsonic(selector.name)
        ? [
            this._jsonReplace(selector.name),
            `${this.q}${selector.alias}${this.q}`
          ].join(' AS ')
        : selector.alias
        ? `${name} AS ${this.q}${selector.alias}${this.q}`
        : this._isJsonic(selector.name)
        ? this._jsonReplace(selector.name)
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
        filters.push(...build.where.map(filter => {
          values.push(...filter.values);
          //then replace with XJsonDialect.parse().extract
          return this._jsonReplace(filter.clause);
        }));
      }
      build.json.forEach(filter => {
        const { query, replace } = filter;
        const json = MysqlJsonDialect.parse(
          filter.selector, 
          this._splitter, 
          this._separator
        );
        //if invalid JSON selector, skip it
        if (!json) return;
        //make a temporary or query object to hold the JSON filters
        const or: OrQueryObject<JSONScalarValue> = { query: [], values: [] };
        //if the operator is contains, we need to use 
        // JSON_CONTAINS and check if it contains the value
        if (query === 'contains') {
          filter.values.forEach(value => {
            json.contains
            or.query.push(json.contains);
            or.values.push(JSON.stringify(value));
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
        if (this._isJsonic(sort.column.name)) {
          return `${this._jsonReplace(sort.column.name)} ${sort.direction.toUpperCase()}`;
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
  public truncate(table: string, cascade = false) {
    return { 
      query: `TRUNCATE TABLE ${this.q}${table}${this.q}${cascade ? ' CASCADE' : ''}`, 
      values: [] 
    };
  }

  /**
   * Converts update builder to query and values
   */
  public update(builder: Update) {
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
  }

  /**
   * Replaces JSON selectors in the given clause 
   * with the corresponding json sql syntax.
   */
  protected _jsonReplace(clause: string) {
    const regexp = new RegExp(this._pattern, 'g');
    return clause.replace(regexp, match => {
      const json = MysqlJsonDialect.parse(
        match,
        this._splitter,
        this._separator
      );
      return json ? json.extract : match;
    });
  }
};

export class MysqlJsonDialect implements JsonDialect {
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
      return new MysqlJsonDialect(column, [], quote);
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
    return new MysqlJsonDialect(column, path, quote);
  }

  //ex. $
  //ex. $."firstName"
  //ex. $."settings"."theme"
  //ex. $."tags"[0]
  public readonly selector: string;
  //ex. JSON_UNQUOTE(JSON_EXTRACT(data, '$."firstName"'))
  public readonly extract: string;
  //ex. JSON_CONTAINS(data, '$."firstName"')
  public readonly contains: string;

  /**
   * Sets the selector and extract properties 
   * based on the column and path provided.
   */
  public constructor(column: Column, path: string[], q: string) {
    //convert paths to proper JSON selectors
    const selectors = path.map(path => (
      isIndex.test(path) ? `[${path}]` : `."${safeJsonValue(path)}"`
    ));
    
    const select = column.table
      ? `${q}${column.table}${q}.${q}${column.name}${q}`
      : `${q}${column.name}${q}`;

    this.selector = '$' + selectors.join('');
    this.extract = `JSON_UNQUOTE(JSON_EXTRACT(${select}, '${this.selector}'))`;
    this.contains = `JSON_CONTAINS(${select}, '${this.selector}')`;
  }

  /**
   * Returns a JSON selector clause for the given operator and value.
   */
  public where(clause: string, replace: string) {
    return clause.replaceAll(replace, this.extract);
  }
};

export default new MysqlDialect();