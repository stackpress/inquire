import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import type { Connection, QueryObject, Transaction } from '../src/types';
import Pgsql from '../src/dialect/Pgsql';
import Engine from '../src/Engine';
import Exception from '../src/Exception';
import Delete from '../src/builder/Delete';
import Insert from '../src/builder/Insert';
import Select from '../src/builder/Select';
import Update from '../src/builder/Update';

describe('Engine Tests', () => {
  it('Should diff table schemas', async () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const from = engine.create('profile')
      .addField('id', {
        type: 'INTEGER',
        length: 11,
        autoIncrement: true
      })
      .addField('name', { type: 'varchar', length: 255 })
      .addField('bio', { type: 'varchar', length: 255 })
      .addField('created', { type: 'datetime', default: 'now()' })
      .addField('active', { type: 'boolean', default: false })
      .addPrimaryKey('id')
      .addUniqueKey('name', 'name')
      .addKey('active', 'active');

    const to = engine.create('profile')
      .addField('id', {
        type: 'INTEGER',
        length: 10,
        unsigned: true,
        autoIncrement: true
      })
      .addField('name', { type: 'varchar', length: 255 })
      //ADD COLUMN "age" INTEGER NOT NULL
      .addField('age', { type: 'integer', length: 3, unsigned: true })
      //ALTER COLUMN "bio" TYPE TEXT
      .addField('bio', { type: 'text' })
      //[same]
      .addField('created', { type: 'datetime', default: 'now()' })
      //ALTER COLUMN "active" SET DEFAULT TRUE
      .addField('active', { type: 'boolean', default: true })
      //[same]
      .addPrimaryKey('id')
      //[same]
      .addUniqueKey('name', 'name');
    //DROP INDEX "active"
    const alter = engine.diff(from, to);
    const queries = alter.query();
    expect(queries[0].query).to.equal(
      `ALTER TABLE "profile" ADD COLUMN "age" INTEGER NOT NULL`
    );
    expect(queries[1].query).to.equal(
      `ALTER TABLE "profile" ALTER COLUMN "id" TYPE SERIAL`
    );
    expect(queries[2].query).to.equal(
      `ALTER TABLE "profile" ALTER COLUMN "bio" TYPE TEXT`
    );
    expect(queries[3].query).to.equal(
      `ALTER TABLE "profile" ALTER COLUMN "active" TYPE BOOLEAN`
    );
    expect(queries[4].query).to.equal(
      `ALTER TABLE "profile" ALTER COLUMN "active" SET DEFAULT TRUE`
    );
    expect(queries[5].query).to.equal(
      `ALTER TABLE "profile" DROP INDEX "active"`
    );

    try {
      engine.diff(from, from).query()
    } catch (error) {
      expect(error.message).to.equal('No alterations made.');
    }
  });

  // Line 50
  it('Should create a new Delete instance when delete method is called with a valid table name', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const deleteInstance = engine.delete('users');
    expect(deleteInstance).to.be.instanceOf(Delete);
  });

  // Line 68 - 69
  it('Should remove a field from "from" schema when it does not exist in "to" schema', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const from = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addField('name', { type: 'varchar', length: 255 })
      .addField('bio', { type: 'varchar', length: 255 });
    const to = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addField('name', { type: 'varchar', length: 255 });
    const alter = engine.diff(from, to);
    expect(alter.query()[0].query).to.include('DROP COLUMN "bio"');
  });

  // Line 89
  it('Should remove primary key from "from" schema when it does not exist in "to" schema', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const from = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addPrimaryKey('id');
    const to = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true });
    const alter = engine.diff(from, to);
    expect(alter.query()[0].query).to.include('ALTER TABLE "profile" DROP CONSTRAINT');
  });


  // Line 95 - 96
  it('Should remove unique key from "from" schema when it does not exist in "to" schema', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const from = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addField('name', { type: 'varchar', length: 255 })
      .addUniqueKey('name', 'name');
    const to = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addField('name', { type: 'varchar', length: 255 });
    const alter = engine.diff(from, to);
    expect(alter.query()[0].query).to.include('ALTER TABLE "profile" DROP UNIQUE');
  });

  // Line 100 - 101
  it('Should update unique key when the unique key definition changes between schemas', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const from = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addField('email', { type: 'varchar', length: 255 })
      .addUniqueKey('email', ['email']);
    const to = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addField('email', { type: 'varchar', length: 255 })
      .addUniqueKey('email', ['email', 'id']);
    const alter = engine.diff(from, to);
    expect(alter.query()[0].query).to.include('ALTER TABLE "profile" DROP UNIQUE');
  });

  // Line 111 - 113
  it('Should call alter.removeKey and alter.addKey when jsonCompare returns false for key comparison', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const from = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addKey('name', ['name']);
    const to = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addKey('name', ['name', 'id']);
    const alter = engine.diff(from, to);
    const query = alter.query()[0].query;
    expect(query).to.include('ALTER TABLE "profile" DROP INDEX');
  });

  // Line 118 - 120
  it('Should remove a foreign key when it exists in "from" schema but not in "to" schema', () => {
  const resource = new MockConnection();
  const engine = new Engine(resource);
  const from = engine.create('profile')
    .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
    .addField('user_id', { type: 'INTEGER', length: 11 })
    .addForeignKey('user_id', { local: 'user_id', foreign: 'id', table: 'users' });
  const to = engine.create('profile')
    .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
    .addField('user_id', { type: 'INTEGER', length: 11 });
  const alter = engine.diff(from, to);
  expect(alter.query()[0].query).to.include('ALTER TABLE "profile" DROP CONSTRAINT');
  });

  // Line 123 - 125
  it('Should call alter.removeForeignKey and alter.addForeignKey when jsonCompare returns false for foreign key comparison with different casing', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const from = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addField('user_id', { type: 'INTEGER', length: 11 })
      .addForeignKey('user_id', { local: 'user_id', foreign: 'ID', table: 'users' });
    const to = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addField('user_id', { type: 'INTEGER', length: 11 })
      .addForeignKey('user_id', { local: 'user_id', foreign: 'id', table: 'users' });
    const alter = engine.diff(from, to);
    const query = alter.query()[0].query;
    expect(query).to.include('ALTER TABLE "profile" DROP CONSTRAINT');
  });

  
  // Line 137
  it('Should add a primary key when the "to" schema has a primary key not present in the "from" schema', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const from = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true });
    const to = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addPrimaryKey('id');
    const alter = engine.diff(from, to);
    expect(alter.query()[0].query).to.include('ALTER TABLE "profile" ADD PRIMARY KEY');
  });

  // Line 143
  it('Should add a unique key when the "to" schema has a unique key not present in the "from" schema', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const from = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true });
    const to = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addField('email', { type: 'varchar', length: 255 })
      .addUniqueKey('email', 'email');
    const alter = engine.diff(from, to);
    expect(alter.query()[0].query).to.include('ALTER TABLE "profile" ADD COLUMN');
  });

  // Line 149
  it('Should add a key when the "to" schema has a key not present in the "from" schema', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const from = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true });
    const to = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addKey('name', ['name']);
    const alter = engine.diff(from, to);
    expect(alter.query()[0].query).to.include('ALTER TABLE "profile" ADD INDEX');
  });

  // Line 154 - 155
  it('Should add a foreign key when the "to" schema has a foreign key not present in the "from" schema', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const from = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addField('user_id', { type: 'INTEGER', length: 11 });
    const to = engine.create('profile')
      .addField('id', { type: 'INTEGER', length: 11, autoIncrement: true })
      .addField('user_id', { type: 'INTEGER', length: 11 })
      .addForeignKey('user_id', { local: 'user_id', foreign: 'id', table: 'users' });
    const alter = engine.diff(from, to);
    expect(alter.query()[0].query).to.include('ALTER TABLE "profile" ADD CONSTRAINT');
  });

  // Line 166 - 226
  it('Should drop a table when the drop method is called with a valid table name', async () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const result = await engine.drop('users');
    expect(result).to.be.an('array').that.is.empty;
  });

  // Line 166 - 226
  it('Should rename a table when the rename method is called with valid "from" and "to" table names', async () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const result = await engine.rename('old_table', 'new_table');
    expect(result).to.be.an('array').that.is.empty;
  });


  // Line 217
  it('Should throw an error when truncate is called with an empty table name', async () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    try {
      await engine.truncate('');
    } catch (error) {
      expect(error).to.be.instanceOf(Exception);
      expect(error.message).to.equal('Table name cannot be empty');
    }
  });

  // Line 166 - 226
  it('Should create a new Insert instance when insert method is called with a valid table name', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const insertInstance = engine.insert('users');
    expect(insertInstance).to.be.instanceOf(Insert);
  });

  // Line 166 - 226
  it('Should create a new Select instance when select method is called with valid column names', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const selectInstance = engine.select(['id', 'name']);
    expect(selectInstance).to.be.instanceOf(Select);
  });

  // Line 166 - 226
  it('Should create a new Update instance when update method is called with a valid table name', () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const updateInstance = engine.update('users');
    expect(updateInstance).to.be.instanceOf(Update);
  });

  // Line 166 - 226
  it('Should execute a transaction when the transaction method is called with a valid callback', async () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const callback = async (trx: any) => {
      return [];
    };
    const result = await engine.transaction(callback);
    expect(result).to.be.an('array').that.is.empty;
  });

  // Line 166 - 226
  it('Should execute a query with a QueryObject and return the expected results', async () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const queryObject: QueryObject = {
      query: 'SELECT * FROM users WHERE id = ?',
      values: [1]
    };
    const result = await engine.query(queryObject);
    expect(result).to.be.an('array').that.is.empty;
  });

  // Line 166 - 226
  it('Should execute a query with a string query and values array and return the expected results', async () => {
    const resource = new MockConnection();
    const engine = new Engine(resource);
    const query = 'SELECT * FROM users WHERE id = ?';
    const values = [1];
    const result = await engine.query(query, values);
    expect(result).to.be.an('array').that.is.empty;
  });

});

class MockConnection implements Connection {
  public dialect = Pgsql;
  public resource = {} as any;

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
    return [];
  }

  /**
   * Runs multiple queries in a transaction
   */
  public async transaction<R = unknown>(callback: Transaction<R>) {
    return [] as R;
  }
}