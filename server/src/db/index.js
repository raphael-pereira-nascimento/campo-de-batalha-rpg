import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dois backends:
//  - DATABASE_URL definida  -> PostgreSQL (produção/Render).
//  - sem DATABASE_URL       -> PGlite (PostgreSQL em WASM), salvo em disco.
//    Assim o modo online funciona sem instalar nada, e contas/fichas/criações
//    ficam realmente persistidas entre reinícios do servidor.
const connectionString = process.env.DATABASE_URL || '';
const localDb = !connectionString;

let pool = null;
let pglite = null;
let ready = Promise.resolve();

if (localDb) {
  const dataDir =
    process.env.PGLITE_DIR || path.join(__dirname, '../../.data/pglite');
  fs.mkdirSync(dataDir, { recursive: true });
  pglite = new PGlite(dataDir);
  ready = pglite.waitReady;
  console.log(`[db] Usando banco local PGlite em ${dataDir}`);
} else {
  pool = new Pool({ connectionString });
  console.log('[db] Usando PostgreSQL via DATABASE_URL');
}

export const isLocalDb = () => localDb;

export async function query(text, params) {
  await ready;
  if (pglite) return pglite.query(text, params);
  return pool.query(text, params);
}

export async function initDb() {
  await ready;
  await query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       version INTEGER PRIMARY KEY,
       name TEXT NOT NULL,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  );
  const { rows } = await query('SELECT version FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.version));
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  let appliedCount = 0;
  for (const file of files) {
    const version = Number(file.split('_')[0]);
    if (!Number.isFinite(version) || applied.has(version)) continue;
    let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    if (pglite) {
      // gen_random_uuid() é nativo no PostgreSQL 13+; o PGlite não tem a
      // extensão pgcrypto, então removemos apenas essa linha.
      sql = sql.replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;/gi, '');
    }

    if (pglite) {
      await pglite.exec('BEGIN');
      try {
        await pglite.exec(sql);
        await pglite.query(
          'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
          [version, file],
        );
        await pglite.exec('COMMIT');
      } catch (err) {
        await pglite.exec('ROLLBACK');
        throw err;
      }
    } else {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
          [version, file],
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
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

export async function closeDb() {
  if (pglite) {
    await pglite.close();
    pglite = null;
  }
  if (pool) {
    await pool.end();
    pool = null;
  }
}
