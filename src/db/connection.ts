import dotenv from 'dotenv';
import knex from 'knex';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connection = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL
});

export default connection;
