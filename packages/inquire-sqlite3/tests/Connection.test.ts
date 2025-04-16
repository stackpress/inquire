import { describe, it } from 'mocha';
import { expect } from 'chai';

//modules
import path from 'path';
import sqlite from 'better-sqlite3';
//stackpress
import Engine from '@stackpress/inquire/Engine';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Connection from '../src/Connection';
import BetterSqlite3Connection from '../src/Connection';

describe('Sqlite3 Tests', () => {
  //this is the raw resource, anything you want
  const resource = sqlite(':memory:');
  //this is the connection
  const connection = new Connection(resource);
  //this is the engine
  const engine = new Engine(connection);

  it('Should connect', async () => {
    const a1 = await engine.create('profile')
      .addField('id', { type: 'int', autoIncrement: true })
      .addField('name', { type: 'string', length: 255 })
      .addField('price', { type: 'float', length: [ 10, 2 ], unsigned: true })
      .addField('age', { type: 'int', unsigned: true })
      .addField('created', { type: 'date', default: 'now()' })
      .addPrimaryKey('id')
      .addUniqueKey('name', 'name');
    expect(a1).to.be.empty;
    const a3 = await engine.insert('profile').values([
      { name: 'John Doe', age: 30 },
      { name: 'Jane Doe', age: 25 }
    ]);
    expect(a3).to.be.empty;
    const a4 = await engine.update('profile')
      .set({ age: 31 })
      .where('name = ?', [ 'Jane Doe' ]);
    expect(a4).to.be.empty;
    const a5 = await engine.delete('profile')
      .where('name = ?', [ 'John Doe' ]);
    expect(a5).to.be.empty;
    const a6 = await engine.select<{
      id: number,
      name: string,
      created: Date,
      age: number
    }>('*').from('profile');
    expect(a6[0].id).to.equal(2);
    expect(a6[0].name).to.equal('Jane Doe');
    expect(a6[0].age).to.equal(31);
    expect(typeof a6[0].created).to.equal('string')
  }).timeout(20000);

  it('Should flatten data', () => {
    const insert = engine.insert('table');
    insert.values([
      { 
        id: 1, 
        name: 'foobar',
        tags: [ 'foo', 'bar' ],
        references: { foo: 'bar' },
        active: true,
        created: new Date()
      },
      { 
        id: 2, 
        name: 'barfoo',
        tags: [ 'bar', 'foo' ],
        references: { bar: 'foo' },
        active: false,
        created: new Date()
      }
    ]);

    const query = insert.query();
    const actual = connection.format(query);
    expect(actual.values[0]).to.equal(1);
    expect(actual.values[1]).to.equal('foobar');
    expect(actual.values[2]).to.equal('["foo","bar"]');
    expect(actual.values[3]).to.equal('{"foo":"bar"}');
    expect(actual.values[4]).to.equal(1);
  });


  // Line 26
  it('Should return the correct lastId after multiple inserts', async () => {
  const insert1 = await engine.insert('profile').values([{ name: 'Alice', age: 28 }]);
  expect(connection.lastId).to.equal(3);
  const insert2 = await engine.insert('profile').values([{ name: 'Bob', age: 35 }]);
  expect(connection.lastId).to.equal(4);
  const insert3 = await engine.insert('profile').values([{ name: 'Charlie', age: 40 }]);
  expect(connection.lastId).to.equal(5);
  });

  // Line 91 - 92
  it('Should ensure no changes are committed to the database after a rollback', async () => {
    try {
      await connection.transaction(async (conn) => {
        await conn.query({ query: 'INSERT INTO profile (name, age) VALUES (?, ?)', values: ['Rollback Test', 99] });
        throw new Error('Force rollback');
      });
    } catch (e) {
      expect(e.message).to.equal('Force rollback');
    }
    const result = await engine.select('*').from('profile').where('name = ?', ['Rollback Test']);
    expect(result).to.be.empty;
  });

  // Line 100
  it('Should handle a query with no values and return the expected result', async () => {
    const expectedResult = [{ id: 1, name: 'Test User' }];
    const resource = {
      prepare: () => ({
        all: () => expectedResult
      })
    };
    const connection = new BetterSqlite3Connection(resource as any);
    const request = { query: 'SELECT * FROM users' };
    const result = await connection['_query'](request);
    expect(result).to.deep.equal(expectedResult);
  });



});