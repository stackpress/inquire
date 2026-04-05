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

type Profile = {
  id: number,
  name: string,
  created: Date,
  age: number,
  active: boolean,
  tags: string[],
  references: Record<string, string>
};

describe('Sqlite3 Tests', () => {
  //this is the raw resource, anything you want
  const resource = sqlite(':memory:');
  //this is the connection
  const connection = new Connection(resource);
  //this is the engine
  const engine = new Engine(connection);

  it('Should create profile table', async () => {
    const actual = await engine.create('profile')
      .addField('id', { type: 'int', autoIncrement: true })
      .addField('name', { type: 'string', length: 255 })
      .addField('price', { type: 'float', length: [ 10, 2 ], unsigned: true })
      .addField('tags', { type: 'json' })
      .addField('references', { type: 'json', nullable: true })
      .addField('datasets', { type: 'json', nullable: true })
      .addField('active', { type: 'boolean', default: true })
      .addField('created', { type: 'date', default: 'now()' })
      .addPrimaryKey('id')
      .addUniqueKey('name', 'name');
    expect(actual).to.be.empty;
  }).timeout(20000);

  it('Should alter profile table', async () => {
    const actual = await engine.alter('profile')
      .addField('age', { type: 'int', unsigned: true })
      .removeField('price');
    expect(actual).to.be.empty;
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

  it('Should insert profile values', async () => {
    const actual = await engine.insert('profile').values([
      { name: 'John Doe', age: 30, active: false, tags: [ 'foo', 'bar' ] },
      { name: 'Jane Doe', age: 25, active: true, tags: [ 'foo', 'zoo' ] }
    ]);
    expect(actual).to.be.empty;
  }).timeout(20000);

  it('Should update profile values', async () => {
    const actual = await engine.update('profile')
      .set({ 
        age: 31, 
        active: false, 
        references: { 
          foo: 'bar',
          bar: { zoo: 'foo' },
          seo: [
            'zoo',
            { keywords: [ 'foo', 'bar' ] }, 
            { title: 'foobar' }
          ]
        },
        datasets: [
          { keywords: [ 'foo', 'bar' ] }, 
          { title: 'foobar' }
        ]
      })
      .where('name = ?', [ 'Jane Doe' ]);
    expect(actual).to.be.empty;
  }).timeout(20000);

  it('Should fetch all profiles', async () => {
    const actual = await engine.select<Profile>('*').from('profile');
    expect(actual.length).to.equal(2);
    expect(actual[1].id).to.equal(2);
    expect(actual[1].name).to.equal('Jane Doe');
    expect(actual[1].age).to.equal(31);
    //not supported by sqlite
    //expect(actual[1].tags[0]).to.equal('foo');
    //expect(actual[1].tags[1]).to.equal('zoo');
    //expect(actual[1].references.foo).to.equal('bar');
    //boolean converts to number in sqlite
    expect(actual[1].active).to.equal(0);
    //Date converts to string in sqlite
    expect(actual[1].created).to.be.a.string;
  }).timeout(20000);

  it('Should filter by json object', async () => {
    const actual = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJson('%s = ?', [ 'references:foo', '%s' ], 'bar');

    expect(actual.length).to.equal(1);
    expect(actual[0].id).to.equal(2);
    expect(actual[0].name).to.equal('Jane Doe');
    expect(actual[0].age).to.equal(31);
    expect(actual[0].active).to.equal(0);
    expect(actual[0].created).to.be.a.string;

    const invalid = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJson('%s = ?', [ 'references:foo', '%s' ], 'foo');
    
    expect(invalid.length).to.equal(0);

    const nested = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJson('%s = ?', [ 'references:bar.zoo', '%s' ], 'foo');

    expect(nested.length).to.equal(1);
    expect(nested[0].id).to.equal(2);
    expect(nested[0].name).to.equal('Jane Doe');
    expect(nested[0].age).to.equal(31);
    expect(nested[0].active).to.equal(0);
    expect(nested[0].created).to.be.a.string;
  }).timeout(20000);

  it('Should filter by json array', async () => {
    const equals = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJson('%s = ?', [ 'tags:1', '%s' ], 'zoo');

    expect(equals.length).to.equal(1);
    expect(equals[0].id).to.equal(2);
    expect(equals[0].name).to.equal('Jane Doe');
    expect(equals[0].age).to.equal(31);
    expect(equals[0].active).to.equal(0);
    expect(equals[0].created).to.be.a.string;

    const notequals = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJsonContains('tags:0', 'baz');
    
    expect(notequals.length).to.equal(0);

    const contains = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJsonContains('tags', 'zoo');

    expect(contains.length).to.equal(1);
    expect(contains[0].id).to.equal(2);
    expect(contains[0].name).to.equal('Jane Doe');
    expect(contains[0].age).to.equal(31);
    expect(contains[0].active).to.equal(0);
    expect(contains[0].created).to.be.a.string;

    const notcontains = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJsonContains('tags', 'baz');
    
    expect(notcontains.length).to.equal(0);
  }).timeout(20000);

  it('Should filter by json nested array', async () => {
    const equals = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJson('%s = ?', [ 'references:seo.0', '%s' ], 'zoo');

    expect(equals.length).to.equal(1);
    expect(equals[0].id).to.equal(2);
    expect(equals[0].name).to.equal('Jane Doe');
    expect(equals[0].age).to.equal(31);
    expect(equals[0].active).to.equal(0);
    expect(equals[0].created).to.be.a.string;

    const notequals = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJsonContains('references:seo.1', 'baz');
    
    expect(notequals.length).to.equal(0);

    const contains = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJsonContains('references:seo', 'zoo');

    expect(contains.length).to.equal(1);
    expect(contains[0].id).to.equal(2);
    expect(contains[0].name).to.equal('Jane Doe');
    expect(contains[0].age).to.equal(31);
    expect(contains[0].active).to.equal(0);
    expect(contains[0].created).to.be.a.string;

    const notcontains = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJsonContains('references:seo', 'baz');
    
    expect(notcontains.length).to.equal(0);
  }).timeout(20000);

  it('Should filter by json nested x 2 array', async () => {
    const equals = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJson('%s = ?', [ 'references:seo.1.keywords.0', '%s' ], 'foo');

    expect(equals.length).to.equal(1);
    expect(equals[0].id).to.equal(2);
    expect(equals[0].name).to.equal('Jane Doe');
    expect(equals[0].age).to.equal(31);
    expect(equals[0].active).to.equal(0);
    expect(equals[0].created).to.be.a.string;

    const contains = await engine
      .select<Profile>('*')
      .from('profile')
      .whereJsonContains('references:seo.1.keywords', 'foo');

    expect(contains.length).to.equal(1);
    expect(contains[0].id).to.equal(2);
    expect(contains[0].name).to.equal('Jane Doe');
    expect(contains[0].age).to.equal(31);
    expect(contains[0].active).to.equal(0);
    expect(contains[0].created).to.be.a.string;
  }).timeout(20000);

  it('Should delete profile', async () => {
    const actual = await engine.delete('profile')
      .where('name = ?', [ 'Jane Doe' ]);
    expect(actual).to.be.empty;
    const rows = await engine.select<Profile>('*').from('profile');
    expect(rows.length).to.equal(1);
  }).timeout(20000);
});