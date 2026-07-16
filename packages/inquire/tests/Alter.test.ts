import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Alter from '../src/builder/Alter';
import Engine from '../src/Engine';
import Exception from '../src/Exception';

describe('Alter Builder Tests', () => {
  it('Should build alter', async () => {
    const alter = new Alter('table');
    alter.addField('id', { 
      type: 'integer',
      length: 11,
      nullable: false,
      comment: 'Foobar',
      autoIncrement: true
    });
    alter.addField('profileId', { 
      type: 'integer',
      length: 11,
      nullable: false,
      comment: 'Foobar',
      autoIncrement: true
    });
    alter.addField('name', { 
      type: 'string',
      length: 255,
      default: 'foobar',
      nullable: true,
      comment: 'Foobar'
    });
    alter.addField('price', { 
      type: 'float',
      length: [ 11, 2 ],
      default: 1.1,
      nullable: true,
      unsigned: true,
      comment: 'Foobar'
    });
    alter.addField('active', { 
      type: 'boolean',
      default: 'true',
      nullable: true,
      comment: 'Foobar'
    });
    alter.addField('date', { 
      type: 'datetime',
      default: 'now()',
      nullable: true,
      comment: 'Foobar'
    });
    alter.addKey('price', 'name');
    alter.addUniqueKey('name', 'name');
    alter.addPrimaryKey('id');
    alter.addForeignKey('profileId', { 
      local: 'profileId',
      foreign: 'id',
      table: 'profile',
      delete: 'CASCADE',
      update: 'RESTRICT'
    });
    alter.removeField('price');
    alter.removeKey('price');
    alter.removeUniqueKey('name');
    alter.removePrimaryKey('id');
    alter.removeForeignKey('profileId');
    alter.changeField('name', {
      type: 'string',
      length: 255,
      default: 'foobar',
      nullable: true,
      comment: 'Foobar'
    });
    const build = alter.build();

    expect(build.fields.add.name.type).to.equal('string');
    expect(build.fields.update.name.type).to.equal('string');
    expect(build.fields.remove[0]).to.equal('price');

    expect(build.keys.add.price[0]).to.equal('name');
    expect(build.keys.remove[0]).to.equal('price');

    expect(build.unique.add.name[0]).to.equal('name');
    expect(build.unique.remove[0]).to.equal('name');

    expect(build.primary.add[0]).to.equal('id');
    expect(build.primary.remove[0]).to.equal('id');

    expect(build.foreign.add.profileId.local).to.equal('profileId');
    expect(build.foreign.remove[0]).to.equal('profileId');
  });

  it('Should replace an added index with a same-named unique key', () => {
    //Define the weaker index first, then promote the alteration to unique.
    const alter = new Alter('table')
      .addKey('identity', 'username')
      .addUniqueKey('identity', 'email');

    const build = alter.build();

    //Only the unique addition should remain in the alteration plan.
    expect(build.keys.add).to.not.have.property('identity');
    expect(build.unique.add.identity).to.deep.equal([ 'email' ]);
  });

  it('Should preserve an added unique key over a same-named index', () => {
    //Define the unique addition first and attempt to add a weaker index later.
    const alter = new Alter('table')
      .addUniqueKey('identity', 'email')
      .addKey('identity', 'username');

    const build = alter.build();

    //Call order must not change the unique-over-index precedence rule.
    expect(build.keys.add).to.not.have.property('identity');
    expect(build.unique.add.identity).to.deep.equal([ 'email' ]);
  });

  it('Should rename a field directly', () => {
    const alter = new Alter('table');
    alter.renameField('full_name', 'name');

    expect(alter.build().fields.rename.full_name).to.equal('name');
  });

  it('Should replace matching remove and add operations with a rename', () => {
    const alter = new Alter('table');
    alter.removeField('full_name');
    alter.addField('name', { type: 'varchar', length: 255 });
    alter.renameField('full_name', 'name');

    const fields = alter.build().fields;
    expect(fields.remove).to.not.include('full_name');
    expect(fields.add).to.not.have.property('name');
    expect(fields.rename.full_name).to.equal('name');
    expect(fields.update.name).to.deep.equal({
      type: 'varchar',
      length: 255
    });
  });

  it('Should reject a field rename with the same source and target', () => {
    const alter = new Alter('table');

    expect(() => alter.renameField('name', 'name')).to.throw(
      Exception,
      'Cannot rename field from "name" to "name".'
    );
  });

  it('Should reject field renames that share a target', () => {
    const alter = new Alter('table');
    alter.renameField('full_name', 'name');

    expect(() => alter.renameField('display_name', 'name')).to.throw(
      Exception,
      'Cannot rename field from "display_name" to "name".'
    );
  });

  it('Should reject a field rename with only a pending removal', () => {
    const alter = new Alter('table');
    alter.removeField('full_name');

    expect(() => alter.renameField('full_name', 'name')).to.throw(
      Exception,
      'Cannot reconcile field rename from "full_name" to "name".'
    );
  });

  it('Should reject a field rename with only a pending addition', () => {
    const alter = new Alter('table');
    alter.addField('name', { type: 'varchar', length: 255 });

    expect(() => alter.renameField('full_name', 'name')).to.throw(
      Exception,
      'Cannot reconcile field rename from "full_name" to "name".'
    );
  });

  // Line 56 - 63
  it('Should handle setting and getting the engine', () => {
    const alter = new Alter('table');
    const mockEngine = {} as Engine;
    expect(alter.engine).to.be.undefined;
    alter.engine = mockEngine;
    expect(alter.engine).to.equal(mockEngine);
    alter.engine = undefined;
    expect(alter.engine).to.be.undefined;
  });


  // Line 146 - 150
  it('Should throw an exception when dialect is not provided and engine is undefined', () => {
    const alter = new Alter('table');
    expect(() => alter.query()).to.throw('No dialect provided');
  });

  // Line 198 - 201
  it('Should throw an exception when no engine is provided', () => {
    const alter = new Alter('table', undefined as unknown as Engine);
    expect(() => alter.then(res => res)).to.throw(Exception, 'No engine provided');
  });

  // Line 198 - 209
  it('Should handle rejection if any query in the transaction fails', () => {
    const mockDialect = {
      alter: () => ['query1', 'query2']};
    const mockEngine = {
      transaction: (callback: any) => {
        return callback({
          query: (formattedQuery: string) => {
            if (formattedQuery === 'query1') {
              return Promise.resolve();
            } else {
              return Promise.reject(new Error('Query failed'));
            }},
          format: (query: string) => query
        });
      },
      dialect: mockDialect} as unknown as Engine;
    const alter = new Alter('table', mockEngine);
    return alter.then(() => {
      throw new Error('Expected promise to be rejected');
    }).catch((error) => {
      expect(error).to.be.an('error');
      expect(error.message).to.equal('Query failed');
    });
  });
  
});
