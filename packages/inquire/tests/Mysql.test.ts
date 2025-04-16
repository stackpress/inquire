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
import Mysql, { getType } from '../src/dialect/Mysql';

describe('Mysql Dialect Tests', () => {
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

    const query = Mysql.alter(alter);
    expect(query[0].query).to.equal(
      "ALTER TABLE `table` ("
        + "DROP `price`, "
        + "ADD COLUMN `id` INT(11) AUTO_INCREMENT, "
        + "ADD COLUMN `profileId` INT(11) AUTO_INCREMENT, "
        + "ADD COLUMN `name` VARCHAR(255) NOT NULL DEFAULT 'foobar', "
        + "ADD COLUMN `price` FLOAT(11, 2) UNSIGNED NOT NULL DEFAULT 1.1, "
        + "ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT TRUE, "
        + "ADD COLUMN `date` DATETIME NOT NULL DEFAULT NOW(), "
        + "CHANGE COLUMN `name` VARCHAR(255) NOT NULL DEFAULT 'foobar', "
        + "DROP PRIMARY KEY `id`, "
        + "ADD PRIMARY KEY (`id`), "
        + "DROP UNIQUE `name`, "
        + "ADD UNIQUE `name` (`name`), "
        + "DROP INDEX `price`, "
        + "ADD INDEX `price` (`name`), "
        + "DROP FOREIGN KEY `profileId`, "
        + "ADD CONSTRAINT `profileId` FOREIGN KEY (`profileId`) "
        + "REFERENCES `profile`(`id`) "
        + "ON DELETE CASCADE ON UPDATE RESTRICT"
      + ")"
    );
    expect(query[0].values).to.be.empty;
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

    const query = Mysql.create(create);
    expect(query[0].query).to.equal(
      "CREATE TABLE IF NOT EXISTS `table` ("
        + "`id` INT(11) AUTO_INCREMENT, "
        + "`profileId` INT(11) AUTO_INCREMENT, `name` VARCHAR(255) NOT NULL DEFAULT 'foobar', "
        + "`price` FLOAT(11, 2) UNSIGNED NOT NULL DEFAULT 1.1, "
        + "`active` BOOLEAN NOT NULL DEFAULT TRUE, "
        + "`date` DATETIME NOT NULL DEFAULT NOW() , "
        + "PRIMARY KEY (`id`) , "
        + "UNIQUE KEY `name` (`name`) , "
        + "KEY `price` (`name`) , "
        + "CONSTRAINT `profileId` FOREIGN KEY (`profileId`) "
        + "REFERENCES `profile`(`id`) "
        + "ON DELETE CASCADE ON UPDATE RESTRICT"
      + ")"
    );
    expect(query[0].values).to.be.empty;
  });

  it('Should translate delete', async () => {
    const remove = new Delete('table');
    remove.where('id = ?', [ 1 ]);

    const query = Mysql.delete(remove);
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

    const query = Mysql.insert(insert);
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
    select.where('id = ?', [ 1 ]);
    select.order('id', 'asc');
    select.limit(1);
    select.offset(1);

    const query = Mysql.select(select);
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
    update.where('id = ?', [ 1 ]);

    const query = Mysql.update(update);
    expect(query.query).to.equal("UPDATE `table` SET `name` = ? WHERE id = ?");
    expect(query.values?.[0]).to.equal('foobar');
    expect(query.values?.[1]).to.equal(1);
  });

  // Line 58
  it('Should set type to "TINYINT" when length is exactly 1', () => {
    const { type, length } = getType('int', 1);
    expect(type).to.equal('TINYINT');
    expect(length).to.be.undefined;
  });

  // Line 60
  it('Should set type to BIGINT when length is greater than 11', () => {
    const { type } = getType('int', 12);
    expect(type).to.equal('BIGINT');
  });


  // Line 118
  it('Should verify that "DEFAULT NULL" is correctly added to the column array when nullable is true', async () => {
    const alter = new Alter('table');
    alter.addField('nullableField', { 
    type: 'string',
    length: 255,
    nullable: true
    });
    
    const query = Mysql.alter(alter);
    expect(query[0].query).to.include('DEFAULT NULL');
  });

   // Line 135
   it('Should verify that "UNSIGNED" is added when the field is unsigned', async () => {
    const alter = new Alter('table');
    alter.changeField('price', {
      type: 'float',
      length: [11, 2],
      unsigned: true,
      nullable: true
    });
  
    const query = Mysql.alter(alter);
    expect(query[0].query).to.include('CHANGE COLUMN `price` FLOAT(11, 2) UNSIGNED');
  });

  
  // Line 248
  it('Should throw an exception when no alterations are made in the Alter builder', async () => {
    const alter = new Alter('table');
    try {
      Mysql.alter(alter);
      throw new Error('Expected exception not thrown');
    } catch (error) {
      expect(error.message).to.equal('No alterations made.');
    }
  });


  // Line 278
  it('Should throw an exception when no fields are provided to the Create builder', async () => {
    const create = new Create('table');
    expect(() => Mysql.create(create)).to.throw('No fields provided');
  });

  // Line 317
  it('Should verify that both "default null" and "DEFAULT NULL" are added to the column array', async () => {
    const create = new Create('table');
    create.addField('nullableField', { 
      type: 'string',
      length: 255,
      nullable: true
    });
    const query = Mysql.create(create);
    expect(query[0].query).to.include('DEFAULT NULL');
  });

  // Line 390
  it('Should throw an exception when no filters are provided in the Delete builder', async () => {
    const remove = new Delete('table');
    expect(() => Mysql.delete(remove)).to.throw('No filters provided');
  });

  // Line 412
  it('Should throw an exception when no values are provided in the Insert builder', async () => {
    const insert = new Insert('table');
    expect(() => Mysql.insert(insert)).to.throw('No values provided');
  });

  // Line 439
  it('Should throw an exception when no table is specified in the Select builder', async () => {
    const select = new Select();
    expect(() => Mysql.select(select)).to.throw('No table specified');
  });

  // Line 455
  it('Should handle table names with special characters in the Select builder', async () => {
    const select = new Select(['column1', 'column2']);
    select.from('my-table', 'my-table-alias');
  
    const query = Mysql.select(select);
    expect(query.query).to.include('FROM `my-table` AS `my-table-alias`');
  });

  // Line 502
  it('Should throw an exception when build.data is an empty object', async () => {
    const update = new Update('table');
    expect(() => Mysql.update(update)).to.throw('No data provided');
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
    const query = Mysql.create(create);
    expect(query[0].query).to.equal(
      'CREATE TABLE IF NOT EXISTS `table` ('
        + '`name` VARCHAR(255) NOT NULL DEFAULT NULL , '
        + 'UNIQUE KEY `foo` (`bar`, `zoo`), '
        + 'UNIQUE KEY `bar` (`zoo`, `foo`) , '
        + 'KEY `foo` (`bar`, `zoo`), '
        + 'KEY `bar` (`zoo`, `foo`) , '
        + 'CONSTRAINT `foo` FOREIGN KEY (`bar`) REFERENCES `foo`(`zoo`) '
        + 'ON DELETE CASCADE ON UPDATE RESTRICT, '
        + 'CONSTRAINT `bar` FOREIGN KEY (`zoo`) REFERENCES `bar`(`foo`) '
        + 'ON DELETE CASCADE ON UPDATE RESTRICT'
      +')'
    );

    expect(query[0].values).to.be.empty;
  });
});