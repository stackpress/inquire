import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Delete from '../src/builder/Delete';
import Engine from '../src/Engine';
import Exception from '../src/Exception';

describe('Delete Builder Tests', () => {
  it('Should build delete', async () => {
    const remove = new Delete('table');
    remove.where('id = ?', [1]);
    const build = remove.build();
    expect(build.table).to.equal('table');
    expect(build.filters[0][0]).to.equal('id = ?');
    expect(build.filters[0][1][0]).to.equal(1);
  });


  // Line 26 - 33
  it('Should handle setting and getting the engine', () => {
    const del = new Delete('table');
    const mockEngine = {} as Engine;
    expect(del.engine).to.be.undefined;
    del.engine = mockEngine;
    expect(del.engine).to.equal(mockEngine);
    del.engine = undefined;
    expect(del.engine).to.be.undefined;
  });

  // Line 58 - 73
  it('Should throw an exception when dialect is not provided and engine is undefined', () => {
    const del = new Delete('table');
    expect(() => del.query()).to.throw('No dialect provided');
  });

  // Line 58 - 73
  it('Should return a promise when query method is called with a valid engine', () => {
    const mockDialect = {
      delete: () => 'mock query' 
    };
    const mockEngine = {
      query: () => Promise.resolve(['result']),
      dialect: mockDialect
    } as unknown as Engine;
    const del = new Delete('table', mockEngine);
    const result = del.then((res) => res);
    expect(result).to.be.a('promise');
    return result.then((res) => {
      expect(res).to.deep.equal(['result']);
    });
  });
  
  // Line 58 - 73
  it('Should throw an exception when no engine is provided', () => {
    const del = new Delete('table', undefined as unknown as Engine);
    expect(() => del.then((res) => res)).to.throw(Exception, 'No engine provided');
  });

  // Line 79
  it('Should handle empty query string in where method without throwing an error', () => {
    const del = new Delete('table');
    expect(() => del.where('')).to.not.throw();
    const build = del.build();
    expect(build.filters).to.deep.equal([['', []]]);
  });

});