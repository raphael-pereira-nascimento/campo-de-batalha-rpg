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
  const migrationsDir = path.join(__dirname, 'migrations');
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       version INTEGER PRIMARY KEY,
       name TEXT NOT NULL,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  );
  const { rows } = await pool.query('SELECT version FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.version));
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  let appliedCount = 0;
  for (const file of files) {
    const version = Number(file.split('_')[0]);
    if (!Number.isFinite(version) || applied.has(version)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [
        version,
        file,
      ]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    console.log(`[db] Migração aplicada: ${file}`);
    appliedCount += 1;
  }
  console.log(
    appliedCount > 0
      ? `[db] ${appliedCount} migração(ões) aplicada(s).`
      : '[db] Schema em dia.',
  );
}

export async function testConnection() {
  const { rows } = await query('SELECT 1 AS ok');
  return rows[0].ok === 1;
}
