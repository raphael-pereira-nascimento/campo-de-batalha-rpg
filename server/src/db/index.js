import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/campo_de_batalha';

export const pool = new Pool({ connectionString });

export async function query(text, params) {
  return pool.query(text, params);
}

export async function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('[db] Schema aplicado com sucesso.');
}

export async function testConnection() {
  const { rows } = await query('SELECT 1 AS ok');
  return rows[0].ok === 1;
}
