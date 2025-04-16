import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Alter from '../src/builder/Alter';
import Create from '../src/builder/Create';
import Delete from '../src/builder/Delete';
import Insert from '../src/builder/Insert';
import Select from '../src/builder/Select';
import Update from '../src/builder/Update';
import Pgsql, { getDefault, getType } from '../src/dialect/Pgsql';

describe('Pgsql Dialect Tests', () => {
  it('Should translate alter', async () => {
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
      comment: 'Foobar'
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
      default: true,
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

    const query = Pgsql.alter(alter);
    
    expect(query[0].query).to.equal(
      'ALTER TABLE "table" DROP COLUMN "price"'
    );
    expect(query[1].query).to.equal(
      'ALTER TABLE "table" ADD COLUMN "id" SERIAL NOT NULL'
    );
    expect(query[2].query).to.equal(
      'ALTER TABLE "table" ADD COLUMN "profileId" INTEGER NOT NULL'
    );
    expect(query[3].query).to.equal(
      'ALTER TABLE "table" ADD COLUMN "name" VARCHAR(255) DEFAULT \'foobar\''
    );
    expect(query[4].query).to.equal(
      'ALTER TABLE "table" ADD COLUMN "price" DECIMAL(11, 2) DEFAULT 1.1'
    );
    expect(query[5].query).to.equal(
      'ALTER TABLE "table" ADD COLUMN "active" BOOLEAN DEFAULT TRUE'
    );
    expect(query[6].query).to.equal(
      'ALTER TABLE "table" ADD COLUMN "date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    );
    expect(query[7].query).to.equal(
      'ALTER TABLE "table" ALTER COLUMN "name" TYPE VARCHAR(255)'
    );
    expect(query[8].query).to.equal(
      'ALTER TABLE "table" ALTER COLUMN "name" SET DEFAULT \'foobar\''
    );
    expect(query[9].query).to.equal(
      'ALTER TABLE "table" DROP CONSTRAINT "id"'
    );
    expect(query[10].query).to.equal(
      'ALTER TABLE "table" ADD PRIMARY KEY ("id")'
    );
    expect(query[11].query).to.equal(
      'ALTER TABLE "table" DROP UNIQUE "name"'
    );
    expect(query[12].query).to.equal(
      'ALTER TABLE "table" ADD UNIQUE "name" ("name")'
    );
    expect(query[13].query).to.equal(
      'ALTER TABLE "table" DROP INDEX "price"'
    );
    expect(query[14].query).to.equal(
      'ALTER TABLE "table" ADD INDEX "price" ("name")'
    );
    expect(query[15].query).to.equal(
      'ALTER TABLE "table" DROP CONSTRAINT "profileId"'
    );
    expect(query[16].query).to.equal(
      'ALTER TABLE "table" ADD CONSTRAINT "profileId" '
      + 'FOREIGN KEY ("profileId") REFERENCES "profile"("id") '
      + 'ON DELETE CASCADE ON UPDATE RESTRICT '
    );
  });

  it('Should translate create', async () => {
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
      comment: 'Foobar'
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
      default: true,
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

    const query = Pgsql.create(create);
    expect(query[0].query).to.equal(
      'CREATE TABLE IF NOT EXISTS "table" ('
      + '"id" SERIAL NOT NULL, '
      + '"profileId" INTEGER NOT NULL, '
      + '"name" VARCHAR(255) DEFAULT \'foobar\', '
      + '"price" DECIMAL(11, 2) DEFAULT 1.1, '
      + '"active" BOOLEAN DEFAULT TRUE, '
      + '"date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP , '
      + 'PRIMARY KEY ("id") , UNIQUE ("name") , '
      + 'CONSTRAINT "profileId" FOREIGN KEY ("profileId") '
      + 'REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE RESTRICT)'
    );
    expect(query[0].values).to.be.empty;
    expect(query[1].query).to.equal(
      'CREATE INDEX "price" ON "table"("name")'
    );
    expect(query[1].values).to.be.empty;
  });

  it('Should translate delete', async () => {
    const remove = new Delete('table');
    remove.where('id = ?', [ 1 ]);

    const query = Pgsql.delete(remove);
    expect(query.query).to.equal(
      'DELETE FROM "table" WHERE id = ?'
    );
    expect(query.values?.[0]).to.equal(1);
  });

  it('Should translate insert', async () => {
    const insert = new Insert('table');
    insert.values([
      { id: 1, name: 'foobar' },
      { id: 2, name: 'barfoo' }
    ]);

    const query = Pgsql.insert(insert);
    expect(query.query).to.equal(
      'INSERT INTO "table" ("id", "name") VALUES (?, ?), (?, ?)'
    );
    expect(query.values?.[0]).to.equal(1);
    expect(query.values?.[1]).to.equal('foobar');
    expect(query.values?.[2]).to.equal(2);
    expect(query.values?.[3]).to.equal('barfoo');
  });

  it('Should translate select', async () => {
    const select = new Select('*');
    select.from('table');
    select.join('inner', 'profile', 'profile.id', 'table.profileId');
    select.where('id = ?', [ 1 ]);
    select.order('id', 'asc');
    select.limit(1);
    select.offset(1);

    const query = Pgsql.select(select);
    expect(query.query).to.equal(
      'SELECT * FROM "table" '
      + 'INNER JOIN "profile" ON ("profile.id" = "table.profileId") '
      + 'WHERE id = ? '
      + 'ORDER BY "id" ASC '
      + 'LIMIT 1 OFFSET 1'
    );
    expect(query.values?.[0]).to.equal(1);
  });

  it('Should translate update', async () => {
    const update = new Update('table');
    update.set({ name: 'foobar' });
    update.where('id = ?', [ 1 ]);

    const query = Pgsql.update(update);
    expect(query.query).to.equal('UPDATE "table" SET "name" = ? WHERE id = ?');
    expect(query.values?.[0]).to.equal('foobar');
    expect(query.values?.[1]).to.equal(1);
  });

  // Line 53
  it('Should set type to "SMALLINT" when length is exactly 1', () => {
    const { type, length } = getType('integer', 1);
    expect(type).to.equal('SMALLINT');
    expect(length).to.be.undefined;
  });

  // Line 55
  it('Should set type to BIGINT when length is greater than 11', () => {
    const { type } = getType('int', 12);
    expect(type).to.equal('BIGINT');
  });

  // Line 69
  
  // Line 75
  it('Should return "CURRENT_DATE" when type is "DATE" and value is not an object', () => {
    const result = getDefault('now()', 'DATE');
    expect(result).to.equal('CURRENT_DATE');
  });

  // Line 77
  it('Should return "CURRENT_TIME" when type is "TIME" and value is "now()"', () => {
    const value = 'now()';
    const type = 'TIME';
    const result = getDefault(value, type);
    expect(result).to.equal('CURRENT_TIME');
  });
  
  // Line 259
  it('Should throw an exception when no alterations are made during an alter operation', async () => {
    const alter = new Alter('table');
    expect(() => Pgsql.alter(alter)).to.throw('No alterations made.');
  });

  // Line 290
  it('Should throw an exception when trying to create a table with no fields provided', async () => {
    const create = new Create('table');
    expect(() => Pgsql.create(create)).to.throw('No fields provided');
  });

  // Line 321
  it('Should handle case where field.default is an empty string and ensure no default value is set', () => {
    const create = new Create('table');
    create.addField('name', {
      type: 'string',
      length: 255,
      default: '',
      nullable: true,
      comment: 'Foobar'
    });
    const query = Pgsql.create(create);
    expect(query[0].query).to.equal(
      'CREATE TABLE IF NOT EXISTS "table" ('
      + '"name" VARCHAR(255) DEFAULT NULL'
      + ')'
    );
    expect(query[0].values).to.be.empty;
  });

  // Line 401
  it('Should throw an exception when no filters are provided for a delete query', async () => {
    const deleteBuilder = new Delete('table');
    expect(() => Pgsql.delete(deleteBuilder)).to.throw('No filters provided');
  });

  // Line 424
  it('Should throw an exception when no values are provided in the Insert builder', async () => {
    const insert = new Insert('table');
    expect(() => Pgsql.insert(insert)).to.throw('No values provided');
  });

  // Line 450 - 451
  it('Should handle case where build.returning is an array with a single column and verify correct SQL generation', () => {
    const builder = new Insert('table');
    builder.values([{ id: 1 }]);
    builder.returning(['id']);
    const queryObject = Pgsql.insert(builder);
    expect(queryObject.query).to.include('RETURNING "id"');
    expect(queryObject.values).to.include(1);
  });

  // Line 452
  it('Should throw an exception when no table is specified in the Select builder', async () => {
    const select = new Select();
    expect(() => Pgsql.select(select)).to.throw('No table specified');
  });

  // Line 468
  it('Should handle table names with special characters in the Select builder', async () => {
    const select = new Select(['column1', 'column2']);
    select.from('my-table', 'my-table-alias');
    const query = Pgsql.select(select);
    expect(query.query).to.include('FROM "my-table" AS "my-table-alias"');
  });

  // Line 516
  it('Should throw an exception when build.data is an empty object', async () => {
    const update = new Update('table');
    expect(() => Pgsql.update(update)).to.throw('No data provided');
  });

  it('Should correctly format a column with a type of "boolean" and no default value', async () => {
    const alter = new Alter('table');
    alter.addField('active', { 
      type: 'boolean',
      nullable: true,
      comment: 'Active status'
    });
    const query = Pgsql.alter(alter);
    expect(query[0].query).to.include('ADD COLUMN "active" BOOLEAN DEFAULT NULL');
    expect(query[0].values).to.be.empty;
  });

  it('Should correctly handle a field with an attribute but no type specified', async () => {
  const alter = new Alter('table');
  alter.addField('customField', { 
    type: 'string',
    attribute: 'CUSTOM_ATTRIBUTE',
    nullable: true
  });
  const query = Pgsql.alter(alter);
  expect(query[0].query).to.include('ADD COLUMN "customField" VARCHAR(255) CUSTOM_ATTRIBUTE DEFAULT NULL');
  expect(query[0].values).to.be.empty;
  });

  it('Should correctly format a column with a type of "integer" and nullable set to true', async () => {
    const alter = new Alter('table');
    alter.addField('age', { 
      type: 'integer',
      nullable: true
    });
    const query = Pgsql.alter(alter);
    expect(query[0].query).to.include('ADD COLUMN "age" INTEGER DEFAULT NULL');
    expect(query[0].values).to.be.empty;
  });

  it('Should handle a field with a type of "text" and no length specified', async () => {
    const alter = new Alter('table');
    alter.changeField('description', {
      type: 'text',
      nullable: true,
      default: undefined
    });
    
    const query = Pgsql.alter(alter);
    expect(query[0].query).to.include('TYPE TEXT');
    expect(query[1].query).to.include('DEFAULT NULL');
    expect(query[0].values).to.be.empty;
    expect(query[1].values).to.be.empty;
  });

  it('Should translate create with multiple indexes, uniques and FKs', () => {
    const create = new Create('table');
    create.addField('name', {
      type: 'string',
      length: 255,
      default: '',
      nullable: true,
      comment: 'Foobar'
    });
    create.addKey('foo', [ 'bar', 'zoo' ]);
    create.addKey('bar', [ 'zoo', 'foo' ]);
    create.addUniqueKey('foo', [ 'bar', 'zoo' ]);
    create.addUniqueKey('bar', [ 'zoo', 'foo' ]);
    create.addForeignKey('foo', {
      local: 'bar',
      foreign: 'zoo',
      table: 'foo',
      delete: 'CASCADE',
      update: 'RESTRICT'
    });
    create.addForeignKey('bar', {
      local: 'zoo',
      foreign: 'foo',
      table: 'bar',
      delete: 'CASCADE',
      update: 'RESTRICT'
    });
    const query = Pgsql.create(create);
    expect(query[0].query).to.equal(
      'CREATE TABLE IF NOT EXISTS "table" ('
        + '"name" VARCHAR(255) DEFAULT NULL , '
        + 'UNIQUE ("bar", "zoo"), '
        + 'UNIQUE ("zoo", "foo") , '
        + 'CONSTRAINT "foo" FOREIGN KEY ("bar") REFERENCES "foo"("zoo") '
        + 'ON DELETE CASCADE ON UPDATE RESTRICT, '
        + 'CONSTRAINT "bar" FOREIGN KEY ("zoo") REFERENCES "bar"("foo") '
        + 'ON DELETE CASCADE ON UPDATE RESTRICT'
      + ')'
    );
    expect(query[1].query).to.equal(
      'CREATE INDEX "foo" ON "table"("bar", "zoo")'
    );
    expect(query[2].query).to.equal(
      'CREATE INDEX "bar" ON "table"("zoo", "foo")'
    );

    expect(query[0].values).to.be.empty;
  });
});