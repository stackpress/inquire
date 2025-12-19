import { PGlite } from '@electric-sql/pglite';
import connect from '@stackpress/inquire-pglite';

async function main() {
  //this is the raw resource, anything you want
  const resource = new PGlite('./build/database');
  //this maps the resource to the engine
  const engine = connect(resource);

  const create = engine.create('profile')
    .addField('id', { type: 'int', autoIncrement: true })
    .addField('name', { type: 'string', length: 255 })
    .addField('age', { type: 'int', length: 2 })
    .addField('price', { type: 'float', length: [ 10, 2 ], unsigned: true, nullable: true })
    .addField('created', { type: 'date', default: 'now()' })
    .addPrimaryKey('id')
    .addUniqueKey('name', 'name');
  console.log(create.query());
  console.log('--', await create);
  
  const insert = engine.insert('profile').values([
    { name: 'John Doe', age: 30 },
    { name: 'Jane Doe', age: 25 }
  ]).returning('*');
  console.log(insert.query());
  console.log('--', await insert);

  const select = engine.select('*').from('profile');
  console.log(select.query());
  console.log('--', await select);
  
  const update = engine.update('profile')
    .set({ age: 31 })
    .where('name = ?', [ 'Jane Doe' ]);
  console.log(update.query());
  console.log('--', await update);
  console.log('--', await select);

  const remove = engine.delete('profile')
    .where('name ILIKE ?', [ '%Doe%' ]);
  console.log(remove.query());
  console.log('--', await remove);
  console.log('--', await select);
}

main().catch(console.error);