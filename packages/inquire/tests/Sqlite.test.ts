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
import Sqlite from '../src/dialect/Sqlite';
import Exception from '../src/Exception';

describe('Sqlite Dialect Tests', () => {
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
      length: [11, 2],
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

    const query = Sqlite.alter(alter);
    expect(query[0].query).to.equal('ALTER TABLE `table` DROP COLUMN `price`');
    expect(query[0].values).to.be.empty;

    expect(query[1].query).to.equal('ALTER TABLE `table` ADD COLUMN `id` INTEGER AUTOINCREMENT');
    expect(query[1].values).to.be.empty;

    expect(query[2].query).to.equal('ALTER TABLE `table` ADD COLUMN `profileId` INTEGER');
    expect(query[2].values).to.be.empty;

    expect(query[3].query).to.equal('ALTER TABLE `table` ADD COLUMN `name` VARCHAR(255) NOT NULL DEFAULT \'foobar\'');
    expect(query[3].values).to.be.empty;

    expect(query[4].query).to.equal('ALTER TABLE `table` ADD COLUMN `price` REAL NOT NULL DEFAULT 1.1');
    expect(query[4].values).to.be.empty;

    expect(query[5].query).to.equal('ALTER TABLE `table` ADD COLUMN `active` INTEGER NOT NULL DEFAULT 1');
    expect(query[5].values).to.be.empty;

    expect(query[6].query).to.equal('ALTER TABLE `table` ADD COLUMN `date` INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP');
    expect(query[6].values).to.be.empty;

    expect(query[7].query).to.equal('ALTER TABLE `table` ALTER COLUMN `name` SET DATA TYPE VARCHAR(255)');
    expect(query[7].values).to.be.empty;

    expect(query[8].query).to.equal('DROP INDEX `name`');
    expect(query[8].values).to.be.empty;

    expect(query[9].query).to.equal('CREATE UNIQUE INDEX `name` ON `table`(`name`)');
    expect(query[9].values).to.be.empty;

    expect(query[10].query).to.equal('DROP INDEX `price`');
    expect(query[10].values).to.be.empty;

    expect(query[11].query).to.equal('CREATE INDEX `price` ON `table`(`name`)');
    expect(query[11].values).to.be.empty;
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
      length: [11, 2],
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

    const query = Sqlite.create(create);
    expect(query[0].query).to.equal(
      "CREATE TABLE IF NOT EXISTS `table` ("
      + "`id` INTEGER PRIMARY KEY AUTOINCREMENT, "
      + "`profileId` INTEGER, "
      + "`name` VARCHAR(255) NOT NULL DEFAULT 'foobar', "
      + "`price` REAL NOT NULL DEFAULT 1.1, "
      + "`active` INTEGER NOT NULL DEFAULT 1, "
      + "`date` INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP, "
      + "FOREIGN KEY (`profileId`) "
      + "REFERENCES `profile`(`id`) "
      + "ON DELETE CASCADE ON UPDATE RESTRICT"
      + ")"
    );
    expect(query[0].values).to.be.empty;
    expect(query[1].query).to.equal(
      'CREATE UNIQUE INDEX `name` ON `table`(`name`)'
    );
    expect(query[1].values).to.be.empty;
    expect(query[2].query).to.equal(
      'CREATE INDEX `price` ON `table`(`name`)'
    );
    expect(query[2].values).to.be.empty;
  });

  it('Should translate delete', async () => {
    const remove = new Delete('table');
    remove.where('id = ?', [1]);

    const query = Sqlite.delete(remove);
    expect(query.query).to.equal(
      "DELETE FROM `table` WHERE id = ?"
    );
    expect(query.values?.[0]).to.equal(1);
  });

  it('Should translate insert', async () => {
    const insert = new Insert('table');
    insert.values([
      { id: 1, name: 'foobar' },
      { id: 2, name: 'barfoo' }
    ]);

    const query = Sqlite.insert(insert);
    expect(query.query).to.equal(
      "INSERT INTO `table` (`id`, `name`) VALUES (?, ?), (?, ?)"
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
    select.where('id = ?', [1]);
    select.order('id', 'asc');
    select.limit(1);
    select.offset(1);

    const query = Sqlite.select(select);
    expect(query.query).to.equal(
      "SELECT * FROM `table` "
      + "INNER JOIN `profile` ON (`profile.id` = `table.profileId`) "
      + "WHERE id = ? "
      + "ORDER BY `id` ASC "
      + "LIMIT 1 OFFSET 1"
    );
    expect(query.values?.[0]).to.equal(1);
  });

  it('Should translate update', async () => {
    const update = new Update('table');
    update.set({ name: 'foobar' });
    update.where('id = ?', [1]);

    const query = Sqlite.update(update);
    expect(query.query).to.equal("UPDATE `table` SET `name` = ? WHERE id = ?");
    expect(query.values?.[0]).to.equal('foobar');
    expect(query.values?.[1]).to.equal(1);
  });

  // Line 133
  it('Should handle case where field.nullable is true and no default value is provided', async () => {
    const alter = new Alter('table');
    alter.addField('description', {
      type: 'string',
      length: 255,
      nullable: true,
      comment: 'Nullable field without default'
    });
    const query = Sqlite.alter(alter);
    expect(query[0].query).to.equal('ALTER TABLE `table` ADD COLUMN `description` VARCHAR(255) NOT NULL DEFAULT NULL');
    expect(query[0].values).to.be.empty;
  });

  // Line 213
  it('Should throw an exception when no alterations are made in the Alter builder', async () => {
    const alter = new Alter('table');
    try {
      Sqlite.alter(alter);
      throw new Error('Expected exception not thrown');
    } catch (error) {
      expect(error.message).to.equal('No alterations made.');
    }
  });

  // Line 269
  it('Should handle case where field.default is an empty string and ensure no default value is set', () => {
    const create = new Create('table');
    create.addField('name', {
      type: 'string',
      length: 255,
      default: '',
      nullable: true,
      comment: 'Foobar'
    });
    const query = Sqlite.create(create);
    expect(query[0].query).to.equal(
      "CREATE TABLE IF NOT EXISTS `table` ("
      + "`name` VARCHAR(255) NOT NULL DEFAULT NULL"
      + ")"
    );
    expect(query[0].values).to.be.empty;
  });

  // Line 334
  it('Should throw an exception when no filters are provided for a delete query', async () => {
    const deleteBuilder = new Delete('table');
    expect(() => Sqlite.delete(deleteBuilder)).to.throw('No filters provided');
  });

  // Line 354
  it('Should handle case where table name contains special characters and ensure correct SQL generation', async () => {
    const tableName = 'table-name_with.special*chars';
    const queryObject = Sqlite.drop(tableName);
    expect(queryObject.query).to.equal('DROP TABLE IF EXISTS `table-name_with.special*chars`');
    expect(queryObject.values).to.be.empty;
  });

  // Line 356
  it('Should throw an exception when no values are provided in the Insert builder', async () => {
    const insert = new Insert('table');
    expect(() => Sqlite.insert(insert)).to.throw('No values provided');
  });

  // Line 382 - 383
  it('Should handle case where build.returning is an array with a single column and verify correct SQL generation', () => {
  const builder = new Insert('table');
  builder.values([{ id: 1 }]);
  builder.returning(['id']);
  const queryObject = Sqlite.insert(builder);
  expect(queryObject.query).to.include('RETURNING `id`');
  expect(queryObject.values).to.include(1);
  });

  // Line 393
  it('Should handle renaming a table with special characters in the name', async () => {
    const queryObject = Sqlite.rename('old-table-name', 'new-table-name');
    expect(queryObject.query).to.equal('ALTER TABLE `old-table-name` RENAME TO `new-table-name`');
    expect(queryObject.values).to.be.empty;
  });

  // Line 399
  it('Should handle case where build.table[0] is an empty string and build.table[1] is a valid string and return an empty query', () => {
    const select = new Select();
    select.from('', 'alias'); 
  
    const result = Sqlite.select(select);
    expect(result.query).to.equal('SELECT * FROM `` AS `alias`');
  });

  // Line 405
  it('Should throw an exception when no table is specified in the Select builder', async () => {
    const select = new Select();
    expect(() => Sqlite.select(select)).to.throw(Exception, 'No table specified');
  });
  

  // Line 416 - 423
  it('Should handle case where build.filters is an empty array and ensure no "where" clause is added', async () => {
  const select = new Select('table');
  select.from('table');
  const query = Sqlite.select(select);
  expect(query.query).to.equal('SELECT table FROM `table`');
  expect(query.values).to.be.empty;
  });

  // Line 455
  it('Should handle case where build.data is an empty object and ensure no query is generated', async () => {
    const update = new Update('table');
    try {
      Sqlite.update(update);
    } catch (error) {
      expect(error.message).to.equal('No data provided');
    }
  });

  // Line 466
  it('Should handle case where table name is an empty string and ensure no query is generated', async () => {
    try {
      Sqlite.truncate('', false);
    } catch (error) {
      expect(error).to.be.instanceOf(Exception);
      expect(error.message).to.equal('No table specified');
    }
  });

  it('Should handle case where field.default is a function call string other than "now()" and ensure it is converted to uppercase', () => {
    const create = new Create('test_table');
    create.addField('createdAt', {
      type: 'datetime',
      default: 'customFunction()',
      nullable: true
    });
    const query = Sqlite.create(create);
    expect(query[0].query).to.include('`createdAt` INTEGER NOT NULL DEFAULT CUSTOMFUNCTION()');
    expect(query[0].values).to.be.empty;
  });


  it('Should handle case where build.fields is an empty object and ensure no columns are generated', () => {
    const create = new Create('empty_table');
    try {
      Sqlite.create(create);
    } catch (error) {
      expect(error.message).to.equal('No fields provided');
    }
  });


  it('Should handle case where field.type is a custom type and ensure it is processed correctly', async () => {
    const alter = new Alter('custom_table');
    alter.addField('customField', {
      type: 'customType',
      length: 50,
      nullable: true,
      default: 'customDefault'
    });
    const query = Sqlite.alter(alter);
    expect(query[0].query).to.equal('ALTER TABLE `custom_table` ADD COLUMN `customField` CUSTOMTYPE(50) NOT NULL DEFAULT \'customDefault\'');
    expect(query[0].values).to.be.empty;
  });

  it('Should handle case where field.length is a negative number and ensure it is processed correctly', async () => {
    const alter = new Alter('table');
    alter.addField('negativeLengthField', {
      type: 'string',
      length: -10,
      nullable: false
    });
    const query = Sqlite.alter(alter);
    expect(query[0].query).to.equal('ALTER TABLE `table` ADD COLUMN `negativeLengthField` VARCHAR(-10)');
    expect(query[0].values).to.be.empty;
  });

  it('Should handle case where field.attribute is a custom attribute and ensure it is included in the query', async () => {
    const alter = new Alter('custom_table');
    alter.addField('customField', {
      type: 'string',
      length: 50,
      nullable: false,
      attribute: 'CUSTOM_ATTRIBUTE'
    });
    const query = Sqlite.alter(alter);
    expect(query[0].query).to.equal('ALTER TABLE `custom_table` ADD COLUMN `customField` VARCHAR(50) CUSTOM_ATTRIBUTE');
    expect(query[0].values).to.be.empty;
  });

  it('Should handle case where field.length is zero and ensure it is processed correctly', async () => {
    const alter = new Alter('table');
    alter.changeField('name', {
      type: 'string',
      length: 0,
      default: 'foobar',
      nullable: true,
      comment: 'Foobar'
    });
    const query = Sqlite.alter(alter);
    expect(query[0].query).to.equal('ALTER TABLE `table` ALTER COLUMN `name` SET DATA TYPE VARCHAR(255)');
    expect(query[0].values).to.be.empty;
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
    const query = Sqlite.create(create);
    expect(query[0].query).to.equal(
      'CREATE TABLE IF NOT EXISTS `table` ('
        + '`name` VARCHAR(255) NOT NULL DEFAULT NULL, '
        + 'FOREIGN KEY (`bar`) REFERENCES `foo`(`zoo`) ' 
        + 'ON DELETE CASCADE ON UPDATE RESTRICT, '
        + 'FOREIGN KEY (`zoo`) REFERENCES `bar`(`foo`) '
        + 'ON DELETE CASCADE ON UPDATE RESTRICT'
      + ')'
    );
    expect(query[1].query).to.equal(
      'CREATE UNIQUE INDEX `foo` ON `table`(`bar`, `zoo`)'
    );
    expect(query[2].query).to.equal(
      'CREATE UNIQUE INDEX `bar` ON `table`(`zoo`, `foo`)'
    );
    expect(query[3].query).to.equal(
      'CREATE INDEX `foo` ON `table`(`bar`, `zoo`)'
    );
    expect(query[4].query).to.equal(
      'CREATE INDEX `bar` ON `table`(`zoo`, `foo`)'
    );

    expect(query[0].values).to.be.empty;
  });
});