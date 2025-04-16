import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Update from '../src/builder/Update';
import Engine from '../src/Engine';
import Exception from '../src/Exception';

describe('Update Builder Tests', () => {
  it('Should build update', async () => {
    const update = new Update('table');
    update.set({ name: 'foobar' });
    update.where('id = ?', [ 1 ]);
    const build = update.build();
    expect(build.table).to.equal('table');
    expect(build.data.name).to.equal('foobar');
    expect(build.filters[0][0]).to.equal('id = ?');
    expect(build.filters[0][1][0]).to.equal(1);

    expect(true).to.be.true;
  });

  // Line 36 - 40
  it('Should handle setting and getting the engine', () => {
    const update = new Update('table');
    const mockEngine = {} as Engine;
    expect(update.engine).to.be.undefined;
    update.engine = mockEngine;
    expect(update.engine).to.equal(mockEngine);
    update.engine = undefined;
    expect(update.engine).to.be.undefined;
  });

  // Line 69 - 73
  it('Should throw an exception when dialect is not provided and engine is undefined', () => {
    const update = new Update('table');
    expect(() => update.query()).to.throw('No dialect provided');
  });

  // Line 89 - 92
  it('Should return a promise when query method is called with a valid engine', () => {
    const mockDialect = {
      update: () => 'mock query' 
    };
    const mockEngine = {
      query: () => Promise.resolve(['result']),
      dialect: mockDialect
    } as unknown as Engine;
    const update = new Update('table', mockEngine);
    const result = update.then((res) => res);
    expect(result).to.be.a('promise');
    return result.then((res) => {
      expect(res).to.deep.equal(['result']);
    });
  });

  // Line 90
  it('Should throw an exception when no engine is provided', () => {
    const update = new Update('table', undefined as unknown as Engine);
    expect(() => update.then((res) => res)).to.throw(Exception, 'No engine provided');
  });

  // Line 98
  it('Should add a filter with an empty query string and no values', () => {
    const update = new Update('table');
    update.where('');
    const filters = update.build().filters;
    expect(filters).to.have.lengthOf(1);
    expect(filters[0][0]).to.equal('');
    expect(filters[0][1]).to.deep.equal([]);
  });
 



});