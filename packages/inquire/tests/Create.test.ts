import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Create from '../src/builder/Create';
import Engine from '../src/Engine';
import Exception from '../src/Exception';
import { QueryObject } from '../src/types';

describe('Create Builder Tests', () => {
  it('Should build create', async () => {
    const create = new Create('table');
    create.addField('id', { 
      type: 'integer',
      length: 11,
      nullable: false,
      comment: 'Foobar',
      autoIncrement: true
    });
    create.addField('profileId', { 
      type: 'integer',
      length: 11,
      nullable: false,
      comment: 'Foobar',
      autoIncrement: true
    });
    create.addField('name', { 
      type: 'string',
      length: 255,
      default: 'foobar',
      nullable: true,
      comment: 'Foobar'
    });
    create.addField('price', { 
      type: 'float',
      length: [ 11, 2 ],
      default: 1.1,
      nullable: true,
      unsigned: true,
      comment: 'Foobar'
    });
    create.addField('active', { 
      type: 'boolean',
      default: 'true',
      nullable: true,
      comment: 'Foobar'
    });
    create.addField('date', { 
      type: 'datetime',
      default: 'now()',
      nullable: true,
      comment: 'Foobar'
    });
    create.addKey('price', 'name');
    create.addUniqueKey('name', 'name');
    create.addPrimaryKey('id');
    create.addForeignKey('profileId', { 
      local: 'profileId',
      foreign: 'id',
      table: 'profile',
      delete: 'CASCADE',
      update: 'RESTRICT'
    });
    const build = create.build();

    expect(build.fields.name.type).to.equal('string');
    expect(build.keys.price[0]).to.equal('name');
    expect(build.unique.name[0]).to.equal('name');
    expect(build.primary[0]).to.equal('id');
    expect(build.foreign.profileId.local).to.equal('profileId');
  });

  // Line 46 - 53
  it('Should handle setting and getting the engine', () => {
    const create = new Create('table');
    const mockEngine = {} as Engine;
    expect(create.engine).to.be.undefined;
    create.engine = mockEngine;
    expect(create.engine).to.equal(mockEngine);
    create.engine = undefined;
    expect(create.engine).to.be.undefined;
  });

  // Line 128 - 143
  it('Should throw an exception when dialect is not provided and engine is undefined', () => {
    const create = new Create('table');
    expect(() => create.query()).to.throw('No dialect provided');
  });

  // Line 128 - 143
  it('Should throw an exception when no engine is provided', () => {
    const create = new Create('table', undefined as unknown as Engine);
    expect(() => create.then((res) => res)).to.throw(Exception, 'No engine provided');
  });

  // Line 145 - 156
  it('Should handle multiple queries correctly and return the result of the last query', async () => {
    const mockEngine = {
      transaction: async (callback: any) => {
        const mockConnection = {
          query: async (query: string) => query,
          format: (request: QueryObject) => request.query};
        return callback(mockConnection);},
      dialect: {
        create: (createInstance: Create) => [
          { query: 'INSERT INTO table (field1) VALUES (value1)' },
          { query: 'INSERT INTO table (field2) VALUES (value2)' }
        ]}} as unknown as Engine;
    const create = new Create('table', mockEngine);
    const result = await create.then((res) => res);
    expect(result).to.equal('INSERT INTO table (field2) VALUES (value2)');
  });

});