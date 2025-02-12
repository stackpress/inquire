import { Pool } from 'pg';
import connect from '@stackpress/inquire-pg';
import * as dotenv from 'dotenv';
dotenv.config()

async function main() {
  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    application_name: "Inquire",
  });
  const connection = await pool.connect();
  const engine = connect(connection);

  const create = engine.create('profile')
    .addField('id', { type: 'VARCHAR', length: 255 })
    .addField('name', { type: 'VARCHAR', length: 255 })
    .addPrimaryKey('id');
  console.log(create.query());
  console.log(await create);

  const insert = engine
    .insert('profile')
    .values({ id: '1', name: 'John Doe' });
  console.log(insert.query());
  console.log(JSON.stringify(await insert, null, 2));

  const select = engine.select('*').from('profile');
  console.log(select.query());
  console.log(JSON.stringify(await select, null, 2));

  connection.release(); 
}

main().catch(console.error);