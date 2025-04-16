import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Insert from '../src/builder/Insert';
import Engine from '../src/Engine';
import Exception from '../src/Exception';

describe('Insert Builder Tests', () => {
  it('Should build insert', async () => {
    const insert = new Insert('table');
    insert.values([
      { id: 1, name: 'foobar' },
      { id: 2, name: 'barfoo' }
    ]);
    const build = insert.build();
    expect(build.table).to.equal('table');
    expect(build.values[0].id).to.equal(1);
    expect(build.values[0].name).to.equal('foobar');
    expect(build.values[1].id).to.equal(2);
    expect(build.values[1].name).to.equal('barfoo');
  });


  // Line 26 - 33
  it('Should handle setting and getting the engine', () => {
    const insert = new Insert('table');
    const mockEngine = {} as Engine;
    expect(insert.engine).to.be.undefined;
    insert.engine = mockEngine;
    expect(insert.engine).to.equal(mockEngine);
    insert.engine = undefined;
    expect(insert.engine).to.be.undefined;
  });

  // Line 58 - 73
  it('Should throw an exception when dialect is not provided and engine is undefined', () => {
    const insert = new Insert('table');
    expect(() => insert.query()).to.throw('No dialect provided');
  });

  // Line 58 - 73
  it('Should return a promise when query method is called with a valid engine', () => {
    const mockDialect = {
      insert: () => 'mock query' 
    };
    const mockEngine = {
      query: () => Promise.resolve(['result']),
      dialect: mockDialect
    } as unknown as Engine;
    const insert = new Insert('table', mockEngine);
    const result = insert.then((res) => res);
    expect(result).to.be.a('promise');
    return result.then((res) => {
      expect(res).to.deep.equal(['result']);
    });
  });
  
  // Line 58 - 73
  it('Should throw an exception when no engine is provided', () => {
    const insert = new Insert('table', undefined as unknown as Engine);
    expect(() => insert.then((res) => res)).to.throw(Exception, 'No engine provided');
  });


  // Line 76
  it('Should set _returning to the provided array when columns is an array', () => {
    const insert = new Insert('table');
    const columnsArray = ['column1', 'column2'];
    insert.returning(columnsArray);
    expect(insert.build().returning).to.deep.equal(columnsArray);
  });


  // Line 78 - 80
  it('Should set _returning to an array with a single "*" when no argument is provided', () => {
    const insert = new Insert('table');
    insert.returning();
    expect(insert.build().returning).to.deep.equal(['*']);
  });


  // Line 96
  it('Should convert a single non-array value to an array when passed to values method', () => {
    const insert = new Insert('table');
    const singleValue = { id: 1, name: 'single' };
    insert.values(singleValue);
    const build = insert.build();
    expect(build.values).to.be.an('array').that.has.lengthOf(1);
    expect(build.values[0]).to.deep.equal(singleValue);
  });
});