import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Select from '../src/builder/Select';
import Engine from '../src/Engine';
import Exception from '../src/Exception';

describe('Select Builder Tests', () => {
  it('Should build select', async () => {
    const select = new Select('*');
    select.from('table');
    select.join('inner', 'profile', 'profile.id', 'table.profileId');
    select.where('id = ?', [ 1 ]);
    select.order('id', 'asc');
    select.limit(1);
    select.offset(1);
    
    const build = select.build();
    expect(build.selectors[0].name).to.equal('*');
    expect(build.from?.name).to.equal('table');
    expect(build.joins[0].type).to.equal('inner');
    expect(build.joins[0].table.name).to.equal('profile');
    expect(build.joins[0].from.name).to.equal('profile.id');
    expect(build.joins[0].to.name).to.equal('table.profileId');
    expect(build.where[0].clause).to.equal('id = ?');
    expect(build.where[0].values[0]).to.equal(1);
    expect(build.sort[0].column.name).to.equal('id');
    expect(build.sort[0].direction).to.equal('asc');
    expect(build.limit).to.equal(1);
    expect(build.offset).to.equal(1);
  });



  // Line 57 - 64
  it('Should handle setting and getting the engine', () => {
    const select = new Select('table');
    const mockEngine = {} as Engine;
    expect(select.engine).to.be.undefined;
    select.engine = mockEngine;
    expect(select.engine).to.equal(mockEngine);
    select.engine = undefined;
    expect(select.engine).to.be.undefined;
  });

  // Line 70
  it('Should initialize with default select value "*" when no select argument is provided', () => {
    const select = new Select();
    expect(select.build().selectors[0].name).to.equal('*');
  });

  // Line 72
  it('Should correctly initialize _columns with multiple column names', () => {
    const select = new Select(['column1', 'column2', 'column3']);
    expect(select.build().selectors.map(s => s.name)).to.deep.equal(['column1', 'column2', 'column3']);
  });

  // Line 129
  it('Should add a sort order with column name and default direction when direction is not provided', () => {
    const select = new Select('table');
    select.order('name');
    const sort = select.build().sort;
    expect(sort).to.have.lengthOf(1);
    expect(sort[0].column.name).to.equal('name');
    expect(sort[0].direction).to.equal('ASC');
  });

  // Line 138 - 153 
  it('Should throw an exception when dialect is not provided and engine is undefined', () => {
    const select = new Select('table');
    expect(() => select.query()).to.throw('No dialect provided');
  });

  // Line 138 - 153 
  it('Should return a promise when query method is called with a valid engine', () => {
    const mockDialect = {
      select: () => 'mock query' 
    };
    const mockEngine = {
      query: () => Promise.resolve(['result']),
      dialect: mockDialect
    } as unknown as Engine;
    const select = new Select('table', mockEngine);
    const result = select.then((res) => res);
    expect(result).to.be.a('promise');
    return result.then((res) => {
      expect(res).to.deep.equal(['result']);
    });
  });
  
  // Line 138 - 153 
  it('Should throw an exception when no engine is provided', () => {
    const select = new Select('table', undefined as unknown as Engine);
    expect(() => select.then((res) => res)).to.throw(Exception, 'No engine provided');
  });

  // Line 159
  it('Should add a filter with an empty query string and no values', () => {
    const select = new Select('table');
    select.where('');
    const filters = select.build().where;
    expect(filters).to.have.lengthOf(1);
    expect(filters[0].clause).to.equal('');
    expect(filters[0].values).to.deep.equal([]);
  });
 


});